export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** 流式是否结束 */
  done: boolean;
  /** 是否出错 */
  error?: boolean;
  /** 是否为兜底/Mock 回复（用于 UI 提示） */
  meta?: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  imageUrls?: string[];
}
