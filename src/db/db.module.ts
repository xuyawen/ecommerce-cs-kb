import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { ENV } from '../config/env.config';

// 全局数据库模块：PG（业务库）+ Redis（短期记忆/缓存）
// 注意：连接延迟创建，模块初始化不强制连服务，保证无依赖也能 boot
export const PG_POOL = 'PG_POOL';
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({
          host: ENV.pg.host,
          port: ENV.pg.port,
          user: ENV.pg.user,
          password: ENV.pg.password,
          database: ENV.pg.database,
          max: 10,
        }),
    },
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: ENV.redis.host,
          port: ENV.redis.port,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
  ],
  exports: [PG_POOL, REDIS_CLIENT],
})
export class DbModule {}
