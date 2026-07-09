import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { VectorStoreService } from '../rag/vector-store.service';
import { KeywordStoreService } from '../rag/keyword-store.service';
import { PG_POOL } from '../db/db.module';
import { ENV } from '../config/env.config';

// 文档入库 pipeline：loader -> splitter -> 向量库 + ES（第 7-8 / 10 章）
@Injectable()
export class IngestService {
  constructor(
    private vector: VectorStoreService,
    private keyword: KeywordStoreService,
    @Inject(PG_POOL) private pg: Pool,
  ) {}

  // 幂等建表：原始文档是「唯一真相」，向量库/ES 视为可重建的派生索引
  private async ensureKbTable() {
    await this.pg.query(`
      CREATE TABLE IF NOT EXISTS kb_documents (
        id SERIAL PRIMARY KEY,
        title TEXT,
        text TEXT,
        source_type TEXT,
        embedding_model TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
  }

  // 原始文档落库（best-effort：PG 不可用时仅告警，不阻断主链路）
  private async saveRawDoc(title: string, text: string, sourceType: string) {
    try {
      await this.ensureKbTable();
      await this.pg.query(
        'INSERT INTO kb_documents(title, text, source_type, embedding_model) VALUES($1,$2,$3,$4)',
        [title, text, sourceType, ENV.llm.embedModel],
      );
    } catch (e: any) {
      console.warn(
        '[ingest] 原始文档持久化失败（PG 不可用），仅写入向量/关键词库：',
        e?.message ?? e,
      );
    }
  }

  async ingest(title: string, text: string, sourceType = 'MD') {
    // 先存原始文档（source of truth），失败也不影响向量/关键词写入
    await this.saveRawDoc(title, text, sourceType);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const docs: Document[] = await splitter.createDocuments(
      [text],
      [{ title, sourceType }],
    );

    await this.vector.addDocuments(docs);
    await this.keyword.ensureIndex();
    for (let i = 0; i < docs.length; i++) {
      await this.keyword.indexChunk(`${title}-${i}`, docs[i].pageContent, {
        title,
        sourceType,
        chunkIndex: i,
      });
    }
    return { title, chunks: docs.length };
  }

  // 一键重灌：读取 kb_documents 全部原始文档，用「当前」embedding 模型重新向量化。
  // 配合维度自检使用：换模型 → 改 MILVUS_COLLECTION 或删旧集合 → 重启 → 调此接口。
  async reindex() {
    await this.ensureKbTable();
    const { rows } = await this.pg.query(
      'SELECT title, text, source_type FROM kb_documents ORDER BY id',
    );
    let count = 0;
    for (const r of rows) {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
      });
      const docs: Document[] = await splitter.createDocuments(
        [r.text],
        [{ title: r.title, sourceType: r.source_type }],
      );
      await this.vector.addDocuments(docs);
      await this.keyword.ensureIndex();
      for (let i = 0; i < docs.length; i++) {
        await this.keyword.indexChunk(`${r.title}-${i}`, docs[i].pageContent, {
          title: r.title,
          sourceType: r.source_type,
          chunkIndex: i,
        });
      }
      count++;
    }
    return { reindexedDocs: count };
  }
}
