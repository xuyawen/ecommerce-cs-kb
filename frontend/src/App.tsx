import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from './types';
import { streamChat } from './api';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { Composer } from './components/Composer';

const newSession = () => 'sess-' + Math.random().toString(36).slice(2, 10);

export default function App() {
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem('cs_session') || newSession(),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem('cs_session', sessionId);
  }, [sessionId]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      done: true,
    };
    const aiId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiId,
      role: 'assistant',
      content: '',
      done: false,
    };
    setMessages((m) => [...m, userMsg, aiMsg]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let acc = '';
      for await (const tok of streamChat(
        { sessionId, message: text },
        ctrl.signal,
      )) {
        acc += tok;
        setMessages((m) =>
          m.map((x) => (x.id === aiId ? { ...x, content: acc } : x)),
        );
      }
      setMessages((m) =>
        m.map((x) => (x.id === aiId ? { ...x, done: true } : x)),
      );
    } catch (e: any) {
      setMessages((m) =>
        m.map((x) =>
          x.id === aiId
            ? {
                ...x,
                content: x.content || '⚠ ' + (e?.message || '请求失败'),
                done: true,
                error: true,
              }
            : x,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(newSession());
  }

  return (
    <div className="app">
      <Sidebar sessionId={sessionId} onReset={reset} streaming={streaming} />
      <main className="main">
        <MessageList messages={messages} onExample={send} />
        <Composer
          value={input}
          onChange={setInput}
          onSend={send}
          streaming={streaming}
        />
      </main>
    </div>
  );
}
