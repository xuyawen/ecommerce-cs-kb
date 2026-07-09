import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { Milvus } from '@langchain/community/vectorstores/milvus';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { ENV } from '../config/env.config';
import { EMBEDDINGS } from '../llm/llm.module';

// 向量存储（Milvus）—— 语义检索（第 9-10 章）
// 注：Milvus SDK 在不同 @langchain 版本构造函数/方法名有差异（旧版用 address、
// similaritySearchWithScore；新版用 url、similaritySearchVectorWithScore）。
// 这里以当前 1.x 为准，并用 any 规避签名差异，便于跨版本编译。
@Injectable()
export class VectorStoreService implements OnModuleInit {
  private instance?: any;

  constructor(@Inject(EMBEDDINGS) private embeddings: any) {}

  // 首次调用时按文档创建 collection（维度由 embedding 模型决定）
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

  // ===== 启动期维度自检（fail-fast）=====
  // 向量索引维度在 Milvus 中建好即锁死，换 embedding 模型会导致维度不一致。
  // 启动时比对「模型实际输出维度」与「已存在集合维度」，不符则明确报错并给出重建指引。
  async onModuleInit() {
    if (ENV.useMock) return; // mock 无真实 embedding 模型，跳过
    try {
      const expected = await this.detectDimension();
      const actual = await this.existingDimension();
      if (actual != null && actual !== expected) {
        throw new Error(
          `[维度不匹配] 当前 embedding 模型「${ENV.llm.embedModel}」输出 ${expected} 维，` +
            `但 Milvus 集合「${ENV.milvus.collection}」为 ${actual} 维。\n` +
            `解决（二选一）：\n` +
            `  1) 改 MILVUS_COLLECTION 为带维度后缀的新名（如 ${ENV.milvus.collection}_${expected}），重启后自动建新集合；\n` +
            `  2) 在 Attu(${ENV.milvus.address}) 删除该集合后重新入库。\n` +
            `随后调用 POST /api/ingest/reindex 用当前模型重灌（需先确保 kb_documents 已持久化原始文档）。`,
        );
      }
      if (actual != null) {
        console.log(`[dimension] OK: collection=${ENV.milvus.collection} dim=${actual}`);
      }
    } catch (e: any) {
      if (e?.message?.includes('[维度不匹配]')) throw e; // 致命：阻断启动
      console.warn('[dimension] 自检跳过（Milvus 未就绪或不可达）：', e?.message ?? e);
    }
  }

  // 通过一次真实向量化探测 embedding 模型输出维度
  private async detectDimension(): Promise<number> {
    const v = await this.embeddings.embedQuery('dimension-check');
    return v.length;
  }

  // 读取已存在 Milvus 集合的向量字段维度；不存在返回 null
  private async existingDimension(): Promise<number | null> {
    const client: any = new (MilvusClient as any)({ address: ENV.milvus.address });
    const has = await client.hasCollection({ collection_name: ENV.milvus.collection });
    if (!has?.value) return null;
    const desc: any = await client.describeCollection({
      collection_name: ENV.milvus.collection,
    });
    const field = (desc?.fields ?? []).find(
      (f: any) => f.data_type === 'FloatVector' || f.data_type === 101,
    );
    if (!field) return null;
    const tp = (field.type_params ?? []).find((p: any) => p.key === 'dim');
    return tp ? parseInt(tp.value, 10) : null;
  }
}
