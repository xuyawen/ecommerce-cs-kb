import { Module } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ENV } from '../config/env.config';

// 提供两个全局可用的 token：CHAT_MODEL（流式对话）、EMBEDDINGS（向量化）
export const CHAT_MODEL = 'CHAT_MODEL';
export const EMBEDDINGS = 'EMBEDDINGS';

@Module({
  providers: [
    {
      provide: CHAT_MODEL,
      useFactory: () =>
        new ChatOpenAI({
          apiKey: ENV.llm.apiKey,
          model: ENV.llm.model,
          temperature: 0.3,
          streaming: true, // 第 18 章：流式输出
          configuration: { baseURL: ENV.llm.baseURL },
        }),
    },
    {
      provide: EMBEDDINGS,
      useFactory: () =>
        new OpenAIEmbeddings({
          apiKey: ENV.llm.apiKey,
          model: ENV.llm.embedModel,
          configuration: { baseURL: ENV.llm.baseURL },
        }),
    },
  ],
  exports: [CHAT_MODEL, EMBEDDINGS],
})
export class LlmModule {}
