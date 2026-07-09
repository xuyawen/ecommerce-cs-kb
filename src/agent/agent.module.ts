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

@Module({
  imports: [RagModule, LlmModule],
  providers: [
    AgentService,
    {
      provide: 'AGENT_TOOLS',
      useFactory: (pool: Pool, rag: RagService) => [
        makeKbTool(rag),
        makeOrderStatusTool(pool),
        makeLogisticsTool(pool),
        makeRefundTool(pool),
      ],
      inject: [PG_POOL, RagService],
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
