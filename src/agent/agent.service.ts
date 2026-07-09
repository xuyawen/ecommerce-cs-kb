import { Injectable, Inject } from '@nestjs/common';
import { CHAT_MODEL } from '../llm/llm.module';
import { RagService } from '../rag/rag.service';
import { RedisMemoryService, ChatTurn } from '../memory/redis-memory.service';
import { ENV } from '../config/env.config';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

// LangGraph 编排的 Agent：自主决策「调工具」还是「查知识库」（第 23-24 章）
@Injectable()
export class AgentService {
  private agent?: any;

  constructor(
    @Inject(CHAT_MODEL) private llm: any,
    private rag: RagService,
    private memory: RedisMemoryService,
    @Inject('AGENT_TOOLS') private tools: any[],
  ) {}

  private buildAgent() {
    if (!this.agent) {
      this.agent = createReactAgent({ llm: this.llm, tools: this.tools });
    }
    return this.agent;
  }

  async *streamReply(
    sessionId: string,
    message: string,
    imageUrls?: string[],
  ): AsyncGenerator<string> {
    const history: ChatTurn[] = await this.memory.getHistory(sessionId);

    // Mock 模式：无 API Key 也能演示整体链路
    if (ENV.useMock) {
      yield* this.mockStream(message);
      return;
    }

    try {
      const agent = this.buildAgent();
      const inputs = {
        messages: [
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      };
      const stream = await agent.stream(inputs, { recursionLimit: 8 });
      for await (const chunk of stream) {
        const msg =
          chunk?.agent?.messages?.[0] ?? chunk?.tools?.messages?.[0];
        const text =
          typeof msg?.content === 'string'
            ? msg.content
            : msg?.content
              ? JSON.stringify(msg.content)
              : '';
        if (text) yield text;
      }
    } catch (e) {
      // 兜底：RAG 直答（保证服务可用）
      yield* this.fallbackRag(message);
    }
  }

  private async *fallbackRag(message: string): AsyncGenerator<string> {
    const ctx = await this.rag.retrieve(message, 4);
    const context = ctx.map((c) => `[${c.citation}] ${c.text}`).join('\n');
    const prompt = `你是电商智能客服。仅基于以下知识回答，并标注引用出处。\n知识:\n${context}\n\n用户: ${message}\n客服:`;
    const stream = await this.llm.stream(prompt);
    for await (const part of stream) yield part.content;
  }

  private async *mockStream(message: string): AsyncGenerator<string> {
    const reply =
      `[mock] 收到：${message}\n` +
      `（已模拟）检索到退换货政策片段，并调用订单工具：订单 SO123 状态=SHIPPED，物流=顺丰，最新节点=派送中。\n` +
      `配置 OPENAI_API_KEY 后，此处即为真实大模型生成的流式回答。`;
    for (const ch of reply) {
      yield ch;
      await new Promise((r) => setTimeout(r, 12));
    }
  }
}
