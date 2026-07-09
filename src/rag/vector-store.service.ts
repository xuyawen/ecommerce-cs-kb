import { Injectable, Inject } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { Milvus } from '@langchain/community/vectorstores/milvus';
import { ENV } from '../config/env.config';
import { EMBEDDINGS } from '../llm/llm.module';

// 向量存储（Milvus）—— 语义检索（第 9-10 章）
// 注：Milvus SDK 在不同 @langchain 版本构造函数/方法名有差异（旧版用 address、
// similaritySearchWithScore；新版用 url、similaritySearchVectorWithScore）。
// 这里以当前 1.x 为准，并用 any 规避签名差异，便于跨版本编译。
@Injectable()
export class VectorStoreService {
  private instance?: any;

  constructor(@Inject(EMBEDDINGS) private embeddings: any) {}

  // 首次调用时按文档创建 collection（小模型默认 1536 维）
  private async ready(seed?: Document[]) {
    if (this.instance) return this.instance;
    const M = Milvus as any;
    const cfg = { url: ENV.milvus.address, collectionName: ENV.milvus.collection };
    this.instance = seed?.length
      ? await M.fromDocuments(seed, this.embeddings, cfg)
      : new M(this.embeddings, cfg);
    return this.instance;
  }

  async addDocuments(docs: Document[]): Promise<void> {
    const v = await this.ready(docs);
    await v.addDocuments(docs);
  }

  async search(query: string, k = 5): Promise<[Document, number][]> {
    const v = await this.ready();
    return v.similaritySearchVectorWithScore(query, k);
  }
}
