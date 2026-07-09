import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';

// 工具：查询订单状态（Agent 调工具办事，第 2-4 / 24 章）
export function makeOrderStatusTool(pool: Pool) {
  return tool(
    async ({ orderNo }) => {
      const r = await pool.query(
        `SELECT o.order_no, o.status, o.amount, l.carrier, l.tracking_no,
                l.status AS ship_status, l.last_node
         FROM orders o
         LEFT JOIN logistics l ON l.order_no = o.order_no
         WHERE o.order_no = $1`,
        [orderNo],
      );
      return r.rows[0]
        ? JSON.stringify(r.rows[0])
        : `未找到订单 ${orderNo}`;
    },
    {
      name: 'order_status',
      description:
        '根据用户订单号查询订单状态、金额、快递公司与物流节点。参数 orderNo 为订单号，如 SO123。',
      schema: z.object({ orderNo: z.string().describe('订单号') }),
    },
  );
}
