import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { VectorStoreService } from './vector-store.service';
import { KeywordStoreService } from './keyword-store.service';
import { HybridRetriever } from './hybrid-retriever';
import { RerankService } from './rerank.service';
import { RagService } from './rag.service';

@Module({
  imports: [LlmModule],
  providers: [
    VectorStoreService,
    KeywordStoreService,
    HybridRetriever,
    RerankService,
    RagService,
  ],
  exports: [RagService, VectorStoreService, KeywordStoreService],
})
export class RagModule {}
