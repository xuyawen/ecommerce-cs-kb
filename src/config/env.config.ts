// 集中读取环境变量（对齐 .env.example）
export const ENV = {
  port: Number(process.env.PORT) || 3000,
  useMock: process.env.USE_MOCK === 'true' || !process.env.OPENAI_API_KEY,

  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'sk-mock',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
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
