import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../db/db.module';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 短期记忆：Redis 维护多轮会话（第 33 章）。采用截断策略（只保留最近 N 条）
// 容错：Redis 未启动时不抛错，降级为「无记忆」以保证服务可用
@Injectable()
export class RedisMemoryService {
  private client: Redis;

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    this.client = redis;
    // 抑制连接错误日志风暴，未启动 Redis 时静默降级
    this.client.on('error', () => {});
  }

  private key(sessionId: string) {
    return `session:${sessionId}`;
  }

  async getHistory(sessionId: string, max = 10): Promise<ChatTurn[]> {
    try {
      const raw = await this.client.lrange(this.key(sessionId), -max, -1);
      return raw.map((j) => JSON.parse(j));
    } catch {
      return [];
    }
  }

  async append(
    sessionId: string,
    role: ChatTurn['role'],
    content: string,
  ): Promise<void> {
    try {
      await this.client.rpush(this.key(sessionId), JSON.stringify({ role, content }));
      await this.client.ltrim(this.key(sessionId), -20, -1); // 截断：最多保留 20 条
      await this.client.expire(this.key(sessionId), 1800); // 30 分钟 TTL
    } catch {
      /* Redis 不可用时忽略 */
    }
  }

  async clear(sessionId: string): Promise<void> {
    try {
      await this.client.del(this.key(sessionId));
    } catch {
      /* ignore */
    }
  }
}
