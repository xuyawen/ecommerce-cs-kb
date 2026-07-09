import { Controller, Post, Body } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IngestDto } from '../common/dto/chat.dto';

@Controller('ingest')
export class IngestController {
  constructor(private svc: IngestService) {}

  @Post()
  async ingest(@Body() dto: IngestDto) {
    return await this.svc.ingest(dto.title, dto.text, dto.sourceType);
  }

  // 一键重灌：用当前 embedding 模型重新向量化 kb_documents 中的全部原始文档
  @Post('reindex')
  async reindex() {
    return await this.svc.reindex();
  }
}
