import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { DbModule } from './db/db.module';
import { ChatModule } from './chat/chat.module';
import { RagModule } from './rag/rag.module';
import { AgentModule } from './agent/agent.module';
import { MemoryModule } from './memory/memory.module';
import { IngestModule } from './ingest/ingest.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    DbModule,
    MemoryModule,
    RagModule,
    AgentModule,
    ChatModule,
    IngestModule,
  ],
})
export class AppModule {}
