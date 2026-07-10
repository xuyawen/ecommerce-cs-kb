import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';

// 引用溯源标记：全角【...】或含 引用/doc/citation/政策 等关键词的 [...]
const CITE_RE =
  /(【[^】]+】|\[[^\]]*(?:引用|doc|citation|政策|条款|文档|手册|faq|FAQ)[^\]]*\])/g;

type Part = { type: 'text' | 'cite'; value: string };

function splitCitations(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CITE_RE.lastIndex = 0;
  while ((m = CITE_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
    parts.push({ type: 'cite', value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

const mdComponents = {
  code({ className, children }: any) {
    const lang = /language-(\w+)/.exec(className || '')?.[1];
    const raw = String(children).replace(/\n$/, '');
    if (lang === 'json') {
      return (
        <pre className="code-card">
          <div className="code-head">⚙ 工具返回 / 数据</div>
          <code>{raw}</code>
        </pre>
      );
    }
    return <code className="inline-code">{children}</code>;
  },
};

export function MessageBubble({ msg }: { msg: ChatMessage }) {
  const parts = splitCitations(msg.content);
  const cites = parts.filter((p) => p.type === 'cite').map((p) => p.value);
  // Agent 正在生成、且尚未吐出任何内容时，展示“思考中”文字提示
  const thinking =
    msg.role === 'assistant' && !msg.done && !msg.error && msg.content.trim() === '';

  return (
    <div className={`msg ${msg.role}`}>
      <div className="avatar">{msg.role === 'user' ? '你' : 'AI'}</div>
      <div className="bubble">
        {thinking ? (
          <div className="thinking">
            <span className="thinking-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="thinking-text">正在思考，请稍候…</span>
          </div>
        ) : (
          <>
            {parts.map((p, i) =>
              p.type === 'cite' ? (
                <span key={i} className="cite-chip">
                  📎 {p.value}
                </span>
              ) : (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {p.value}
                </ReactMarkdown>
              ),
            )}
            {!msg.done && !msg.error && <span className="cursor">▍</span>}
          </>
        )}

        {msg.error && <div className="err">⚠ 出错了，请重试</div>}

        {cites.length > 0 && msg.done && (
          <div className="cite-row">
            {cites.map((c, i) => (
              <span key={i} className="cite-pill">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
