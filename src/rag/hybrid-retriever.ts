import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { VectorStoreService } from './vector-store.service';
import { KeywordStoreService } from './keyword-store.service';

export interface RankedDoc {
  doc: Document;
  score: number;
  citation: string;
}

// 混合检索：向量召回 + ES 召回，融合为候选集（第 27 章：多路召回）
@Injectable()
export class HybridRetriever {
  constructor(
    private vector: VectorStoreService,
    private keyword: KeywordStoreService,
  ) {}

  async retrieve(query: string, k = 5): Promise<RankedDoc[]> {
    const [vecRes, kwRes] = await Promise.all([
      this.vector.search(query, k).catch(() => [] as [Document, number][]),
      this.keyword.search(query, k).catch(() => [] as any[]),
    ]);

    const map = new Map<string, RankedDoc>();

    // 向量结果
    vecRes.forEach(([doc, score], i) => {
      const key = doc.pageContent.slice(0, 80);
      map.set(key, {
        doc,
        score: 1 - Math.min(score, 1), // 距离转相似度（近似）
        citation: doc.metadata?.title || '知识库',
      });
    });

    // 关键词结果（BM25 分数归一）
    const maxKw = Math.max(1, ...kwRes.map((r) => r.score));
    kwRes.forEach((r) => {
      const key = r.content.slice(0, 80);
      const exist = map.get(key);
      const s = r.score / maxKw;
      if (exist) exist.score = Math.max(exist.score, s);
      else
        map.set(key, {
          doc: new Document({ pageContent: r.content, metadata: r.meta }),
          score: s,
          citation: r.meta?.title || '知识库',
        });
    });

    return [...map.values()].sort((a, b) => b.score - a.score).slice(0, k);
  }
}
