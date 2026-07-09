import { IsString, IsOptional, IsArray } from 'class-validator';

// 对话请求体
export class ChatDto {
  @IsString()
  sessionId: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[]; // 多模态：用户上传的商品/破损图（第 40 章）
}

// 入库请求体
export class IngestDto {
  @IsString()
  title: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  sourceType?: string; // PDF/WORD/HTML/MD
}
