import {
  Controller,
  Post,
  Body,
  Sse,
  Get,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageEvent } from 'http';
import { ChatService } from './chat.service';
import { ChatDto } from '../common/dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  // SSE 流式对话（第 18 章：基于 SSE 的流式 AI 接口）
  @Post('stream')
  @Sse()
  stream(@Body() dto: ChatDto): Observable<MessageEvent> {
    return from(this.chat.streamReply(dto)).pipe(
      map((token) => ({ data: token }) as MessageEvent),
    );
  }

  // 非流式（一次性返回）
  @Post()
  async reply(@Body() dto: ChatDto) {
    return { answer: await this.chat.reply(dto) };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'chat' };
  }
}
