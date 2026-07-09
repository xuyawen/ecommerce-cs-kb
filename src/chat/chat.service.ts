import { Injectable } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { RedisMemoryService } from '../memory/redis-memory.service';
import { ChatDto } from '../common/dto/chat.dto';

// 对话业务层：串联 Agent 流式生成 + 短期记忆持久化
@Injectable()
export class ChatService {
  constructor(
    private agent: AgentService,
    private memory: RedisMemoryService,
  ) {}

  // 流式：逐字产出，并在结束时把用户/助手消息写入 Redis 记忆
  async *streamReply(dto: ChatDto): AsyncGenerator<string> {
    let full = '';
    for await (const token of this.agent.streamReply(
      dto.sessionId,
      dto.message,
      dto.imageUrls,
    )) {
      full += token;
      yield token;
    }
    await this.memory.append(dto.sessionId, 'user', dto.message);
    await this.memory.append(dto.sessionId, 'assistant', full);
  }

  async reply(dto: ChatDto): Promise<string> {
    let out = '';
    for await (const token of this.streamReply(dto)) out += token;
    return out;
  }
}
