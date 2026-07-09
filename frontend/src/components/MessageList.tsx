import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

export function MessageList({
  messages,
  onExample,
}: {
  messages: ChatMessage[];
  onExample: (q: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="empty">
        <div className="empty-logo">🛒</div>
        <h2>电商智能客服 · 知识库助手</h2>
        <p>支持「知识库问答 / 订单查询 / 物流追踪 / 退换货」多轮对话，回答可溯源。</p>
        <div className="examples">
          {[
            '我的订单 SO123 到哪了？',
            '七天无理由退换货怎么操作？',
            '这件商品支持开增值税发票吗？',
          ].map((e) => (
            <span key={e} className="example" onClick={() => onExample(e)}>
              {e}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((m) => (
        <MessageBubble key={m.id} msg={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
