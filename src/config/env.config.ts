import * as dotenv from 'dotenv';
dotenv.config(); // 必须在计算 ENV 之前加载 .env，否则 useMock 会在 .env 注入前被误判为 true

// 集中读取环境变量（对齐 .env.example）
export const ENV = {
  port: Number(process.env.PORT) || 3000,
  // 使用通用 LLM_* 名称
  useMock:
    process.env.USE_MOCK === 'true' ||
    !process.env.LLM_API_KEY,

  llm: {
    apiKey:
      process.env.LLM_API_KEY || 'sk-mock',
    baseURL:
      process.env.LLM_BASE_URL,
    model:
      process.env.LLM_MODEL,
    embedModel:
      process.env.LLM_EMBED_MODEL,
  },

  milvus: {
    address: process.env.MILVUS_ADDRESS || 'localhost:19530',
    collection: process.env.MILVUS_COLLECTION || 'cs_kb',
    dim: Number(process.env.MILVUS_DIM) || 1536,
  },

  es: {
    node: process.env.ES_NODE || 'http://localhost:9200',
    index: process.env.ES_INDEX || 'cs_kb',
  },

  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DATABASE || 'cs_kb',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
};
