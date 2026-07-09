import type { ChatRequest } from './types';

/**
 * 调用后端 SSE 流式接口（POST /api/chat/stream）。
 *
 * 注意：浏览器原生 EventSource 只支持 GET，而本接口是 POST，
 * 因此用 fetch + ReadableStream 手动解析 SSE 文本流。
 *
 * 后端每条事件格式为：`data: <token>\n\n`（token 为原始文本片段）。
 */
export async function* streamChat(
  body: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`后端返回 ${res.status} ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  // 以空行 `\n\n` 作为事件边界，避免 token 内本身含换行被截断
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const event = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      for (const line of event.split('\n')) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('data:')) {
          yield trimmed.slice(5).replace(/^ /, '');
        }
      }
    }
  }

  // 冲刷缓冲区中可能残留的最后一个事件
  if (buf.trim()) {
    for (const line of buf.split('\n')) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('data:')) {
        yield trimmed.slice(5).replace(/^ /, '');
      }
    }
  }
}

/** 非流式一次性返回（用于调试/降级） */
export async function onceChat(body: ChatRequest): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.answer as string;
}
