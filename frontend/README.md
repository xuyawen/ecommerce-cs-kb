# 智能客服知识库 · 前端对话界面

基于 **Vite + React + TypeScript** 的流式聊天 UI，对接后端 `POST /api/chat/stream`（`SSE`）。

## 功能

- **SSE 逐字流式**：用 `fetch + ReadableStream` 手动解析 SSE（浏览器原生 `EventSource` 仅支持 GET，本接口是 POST）。
- **Markdown 渲染**：`react-markdown` + `remark-gfm`（表格 / 列表 / 代码块）。
- **引用溯源**：自动识别 `【文档名】` 或 `[引用/政策/条款...]` 标记，渲染为可溯源 chip。
- **工具数据卡片**：LLM 工具返回的 ` ```json ` 代码块自动渲染为「工具返回 / 数据」卡片。
- **多轮会话**：`sessionId` 存于 `localStorage`，后端据此读取 Redis 短期记忆。
- **示例问题 / 新对话**：空状态引导 + 一键重置会话。

## 目录

```
frontend/
├─ index.html
├─ vite.config.ts      # /api 代理到 localhost:3000
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx           # 状态 / 发送 / 流式累积
│  ├─ api.ts            # SSE 流式解析
│  ├─ types.ts
│  └─ components/
│     ├─ Sidebar.tsx
│     ├─ MessageList.tsx
│     ├─ MessageBubble.tsx
│     └─ Composer.tsx
```

## 运行

```bash
# 1. 先起后端与中间件（见项目根 README）
docker compose up -d
npm run start:dev        # 后端在 :3000

# 2. 另开终端起前端
cd frontend
npm install
npm run dev              # 访问 http://localhost:5173
```

> 开发模式下 Vite 已配置 `/api` 代理到 `localhost:3000`，无需处理跨域。
> 若后端未配 `LLM_API_KEY`，会走 `USE_MOCK=true` 的 Mock 链路，前端照样能验证流式效果。

## 生产构建

```bash
npm run build            # 产物在 dist/
npm run preview
```

部署时由 Nginx 将 `/` 指向前端静态资源、`/api` 反代到后端即可。

## 可扩展方向

- 引用 chip 点击跳转知识库原文（需后端在 SSE 中下发结构化 `citation` 事件）。
- 工具调用过程可视化（如「🔍 检索知识库 → 🛠 查询订单」步骤条）。
- 多模态：上传商品图后把 `imageUrls` 一并 POST（对应后端 `ChatDto.imageUrls`）。
