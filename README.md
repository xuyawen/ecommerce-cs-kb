# 电商智能客服知识库（Agentic RAG）

> 企业级电商智能客服知识库（Agentic RAG）。基于企业私有知识做准确问答，并能调工具处理实时业务（查订单 / 查物流 / 发起退款），支持流式对话与多模态。

## 技术栈
**后端**：Nest.js · LangChain.js · LangGraph · Milvus · Elasticsearch · PostgreSQL · Redis · Docker
**前端**：Vite · React · TypeScript（流式对话 UI，见 `frontend/`）

## 目录结构
```
src/
├── main.ts                  # 启动入口（CORS、全局前缀 /api、校验管道）
├── app.module.ts            # 根模块
├── config/env.config.ts     # 环境变量
├── llm/                     # ChatModel / Embeddings 提供
├── db/                      # PG / Redis 连接模块
├── chat/                    # SSE 流式对话接口
├── rag/                     # 混合检索 + 重排 + 向量/关键词存储
├── agent/                   # LangGraph 编排 + Tools
│   └── tools/               # 订单/物流/退款工具
├── memory/                  # Redis 短期记忆
└── ingest/                  # 文档入库 pipeline（loader + splitter）
frontend/                    # React 流式对话界面（Vite）
```

## 快速开始

### 1) 后端
```bash
cp .env.example .env         # 填入 LLM_API_KEY（或设 USE_MOCK=true 先跑结构）
docker compose up -d         # 起 Milvus / ES / PG / Redis
npm install --legacy-peer-deps
npm run start:dev            # http://localhost:3000
```

### 2) 前端（另开终端）
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173（已配置 /api 代理到 :3000）
```
> 开发模式 Vite 自动把 `/api` 代理到后端 `:3000`，无需处理跨域。
> 未配 `LLM_API_KEY` 时后端走 Mock 链路，前端照样能验证流式效果。

## 接口示例
```bash
# 流式问答（SSE）
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"s1","message":"我买的鞋子什么时候到？订单号 SO123"}'

# 文档入库
curl -X POST http://localhost:3000/api/ingest \
  -H 'Content-Type: application/json' \
  -d '{"title":"退换货政策","text":"商品签收后7天内可申请无理由退货……"}'
```

## 说明
- `USE_MOCK=true` 且未配置 Key 时，接口以 mock 数据返回，便于无 LLM 情况下验证整体结构（已验证：应用可启动、SSE 流式、健康检查均正常）。
- 课程对应章节：RAG(6/10)、混合检索(26/27)、LangGraph(23/24)、Nest 流式(18/35)、PG(32)、Redis(33)、Docker(25)、多模态(40)。
- 依赖与版本要点（已对齐可编译）：
  - LangChain 生态已到 **core 1.x**，安装务必加 `--legacy-peer-deps`。
  - 向量库 SDK 包名现为 **`@zilliz/milvus2-sdk-node`**（旧名 `milvus2-sdk-node` 已废弃）。
  - `@langchain/community` 的 Milvus 为**命名导出** `{ Milvus }`，构造参数用 `url`、检索方法为 `similaritySearchVectorWithScore`。
  - 记忆层（Redis）对连接失败做了**容错降级**，无 Redis 也能跑通主链路。
- 完整运行需 `docker compose up -d` 起 Milvus/ES/PG/Redis，并配置 `LLM_API_KEY`。
