import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { HybridRetriever, RankedDoc } from './hybrid-retriever';
import { RerankService } from './rerank.service';
import { VectorStoreService } from './vector-store.service';
import { KeywordStoreService } from './keyword-store.service';

export interface RetrievedContext {
  text: string;
  citation: string;
}

// RAG 检索编排：混合召回 -> 重排 -> 上下文（带引用溯源，第 39 章合规要求）
@Injectable()
export class RagService {
  constructor(
    private hybrid: HybridRetriever,
    private rerank: RerankService,
    private vector: VectorStoreService,
    private keyword: KeywordStoreService,
  ) {}

  async retrieve(query: string, k = 4): Promise<RetrievedContext[]> {
    // 同时拿两路（用于重排融合）
    const vec = await this.vector.search(query, k).catch(() => [] as any);
    const kw = await this.keyword.search(query, k).catch(() => [] as any);

    const toRanked = (arr: any[], citationFromMeta: boolean): RankedDoc[] =>
      arr.map((item, i) => {
        let doc: Document;
        if (item.doc) doc = item.doc;
        else if (item.content != null)
          doc = new Document({
            pageContent: item.content,
            metadata: item.meta ?? {},
          });
        else doc = new Document({ pageContent: String(item), metadata: {} });
        const citation =
          citationFromMeta && item?.meta?.title
            ? item.meta.title
            : '知识库';
        return { doc, score: 1 / (i + 1), citation };
      });

    const reranked = this.rerank.rerank(
      toRanked(vec, false),
      toRanked(kw, true),
      k,
    );

    return reranked.map((r) => ({
      text: r.doc.pageContent,
      citation: r.citation || r.doc.metadata?.title || '知识库',
    }));
  }
}
