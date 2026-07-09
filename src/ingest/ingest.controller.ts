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
}
