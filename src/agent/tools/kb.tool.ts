import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RagService } from '../../rag/rag.service';

// 工具：知识库检索（让 Agent 在需要时自主查私有知识，第 24 章 Agentic RAG）
export function makeKbTool(rag: RagService) {
  return tool(
    async ({ query }) => {
      const ctx = await rag.retrieve(query, 3);
      return ctx.map((c) => `[${c.citation}] ${c.text}`).join('\n---\n');
    },
    {
      name: 'kb_search',
      description: '从企业私有知识库检索退换货政策、商品信息等。参数为检索问题。',
      schema: z.object({ query: z.string().describe('检索问题') }),
    },
  );
}
