import { Module, Global } from '@nestjs/common';
import { RedisMemoryService } from './redis-memory.service';

@Global()
@Module({
  providers: [RedisMemoryService],
  exports: [RedisMemoryService],
})
export class MemoryModule {}
