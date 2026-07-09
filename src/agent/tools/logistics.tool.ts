import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';

// 工具：查询物流轨迹
export function makeLogisticsTool(pool: Pool) {
  return tool(
    async ({ orderNo }) => {
      const r = await pool.query(
        `SELECT carrier, tracking_no, status, last_node, updated_at
         FROM logistics WHERE order_no = $1 ORDER BY updated_at DESC LIMIT 1`,
        [orderNo],
      );
      return r.rows[0]
        ? JSON.stringify(r.rows[0])
        : `未查询到 ${orderNo} 的物流信息`;
    },
    {
      name: 'logistics_query',
      description: '根据订单号查询最新物流轨迹与签收状态。',
      schema: z.object({ orderNo: z.string().describe('订单号') }),
    },
  );
}
