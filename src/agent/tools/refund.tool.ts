import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';

// 工具：创建退款申请（仅生成 PENDING 待审核记录，绝不自动打款——合规要求）
export function makeRefundTool(pool: Pool) {
  return tool(
    async ({ orderNo, reason }) => {
      const r = await pool.query(
        `INSERT INTO refunds(order_no, reason, status)
         VALUES($1, $2, 'PENDING') RETURNING id`,
        [orderNo, reason],
      );
      return `已为订单 ${orderNo} 创建退款申请（待人工审核），申请号 #${r.rows[0].id}`;
    },
    {
      name: 'create_refund',
      description:
        '为用户创建退款申请，仅生成待审核记录，不会自动退款。需要订单号与退款原因。',
      schema: z.object({
        orderNo: z.string().describe('订单号'),
        reason: z.string().describe('退款原因'),
      }),
    },
  );
}
