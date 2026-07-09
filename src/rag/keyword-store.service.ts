import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ENV } from '../config/env.config';

// 关键词检索（Elasticsearch / BM25 + IK）—— 精确匹配商品名、订单号等（第 26 章）
@Injectable()
export class KeywordStoreService {
  private client = new Client({ node: ENV.es.node });

  async ensureIndex(): Promise<void> {
    try {
      await this.client.indices.create({ index: ENV.es.index });
    } catch (e: any) {
      if (!/already exists|resource_already_exists/.test(e?.message || '')) throw e;
    }
  }

  async indexChunk(id: string, content: string, meta: Record<string, any>): Promise<void> {
    await this.client.index({
      index: ENV.es.index,
      id,
      document: { content, ...meta },
    });
  }

  async search(query: string, k = 5): Promise<{ content: string; meta: any; score: number }[]> {
    const res = await this.client.search({
      index: ENV.es.index,
      query: { multi_match: { query, fields: ['content'], type: 'best_fields' } },
      size: k,
    });
    return res.hits.hits.map((h: any) => ({
      content: h._source.content,
      meta: { ...h._source, score: h._score },
      score: h._score ?? 0,
    }));
  }
}
