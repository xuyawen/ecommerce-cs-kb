import { Injectable } from '@nestjs/common';
import { RankedDoc } from './hybrid-retriever';

// 重排（Rerank）—— 这里用 Reciprocal Rank Fusion 做无模型融合（第 27 章）
// 生产可替换为交叉编码器（cross-encoder）提升精度
@Injectable()
export class RerankService {
  rerank(vectorRanked: RankedDoc[], keywordRanked: RankedDoc[], k = 5): RankedDoc[] {
    const kRrf = 60;
    const score = new Map<string, { doc: RankedDoc; s: number }>();

    const fuse = (list: RankedDoc[], rank: number) => {
      list.forEach((item, idx) => {
        const key = item.doc.pageContent.slice(0, 80);
        const add = 1 / (kRrf + idx + 1);
        const cur = score.get(key);
        if (cur) cur.s += add;
        else score.set(key, { doc: item, s: add });
      });
    };
    fuse(vectorRanked, 0);
    fuse(keywordRanked, 1);

    return [...score.values()]
      .sort((a, b) => b.s - a.s)
      .slice(0, k)
      .map((x) => x.doc);
  }
}
