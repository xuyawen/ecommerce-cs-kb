import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { VectorStoreService } from '../rag/vector-store.service';
import { KeywordStoreService } from '../rag/keyword-store.service';

// 文档入库 pipeline：loader -> splitter -> 向量库 + ES（第 7-8 / 10 章）
@Injectable()
export class IngestService {
  constructor(
    private vector: VectorStoreService,
    private keyword: KeywordStoreService,
  ) {}

  async ingest(title: string, text: string, sourceType = 'MD') {
    // 切分（中文场景可调小 chunkSize）
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const docs: Document[] = await splitter.createDocuments(
      [text],
      [{ title, sourceType }],
    );

    // 向量化入库
    await this.vector.addDocuments(docs);
    // 关键词索引
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
}
