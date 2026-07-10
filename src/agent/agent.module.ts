import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AgentService } from './agent.service';
import { RagModule } from '../rag/rag.module';
import { LlmModule } from '../llm/llm.module';
import { PG_POOL } from '../db/db.module';
import { RagService } from '../rag/rag.service';
import { makeOrderStatusTool } from './tools/order-status.tool';
import { makeLogisticsTool } from './tools/logistics.tool';
import { makeRefundTool } from './tools/refund.tool';
import { makeKbTool } from './tools/kb.tool';
import { ensureOrderSchema } from './tools/order-schema';

@Module({
  imports: [RagModule, LlmModule],
  providers: [
    AgentService,
    {
      provide: 'AGENT_TOOLS',
      useFactory: async (pool: Pool, rag: RagService) => {
        // 启动即幂等建表 + 注入演示数据，保证订单/物流工具可直接查询
        try {
          await ensureOrderSchema(pool);
        } catch (e: any) {
          console.warn('[agent] 订单域表初始化失败（将在工具调用时重试）：', e?.message ?? e);
        }
        return [
          makeKbTool(rag),
          makeOrderStatusTool(pool),
          makeLogisticsTool(pool),
          makeRefundTool(pool),
        ];
      },
      inject: [PG_POOL, RagService],
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
