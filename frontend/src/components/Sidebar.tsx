interface Props {
  sessionId: string;
  onReset: () => void;
  streaming: boolean;
}

export function Sidebar({ sessionId, onReset, streaming }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-dot" />
        智能客服知识库
      </div>

      <button className="new-chat" onClick={onReset} disabled={streaming}>
        + 新对话
      </button>

      <div className="meta">
        <div className="meta-row">
          <span>会话 ID</span>
          <code title={sessionId}>{sessionId.slice(0, 12)}…</code>
        </div>
        <div className="meta-row">
          <span>状态</span>
          <span className={streaming ? 'badge live' : 'badge idle'}>
            {streaming ? '生成中' : '空闲'}
          </span>
        </div>
        <div className="meta-row">
          <span>模式</span>
          <span className="badge mock">Agentic RAG</span>
        </div>
      </div>

      <div className="tips">
        <div className="tips-title">技术栈</div>
        <ul>
          <li>Nest.js + LangGraph</li>
          <li>Milvus + ES 混合检索</li>
          <li>RRF 重排 · Redis 记忆</li>
          <li>SSE 流式输出</li>
        </ul>
      </div>
    </aside>
  );
}
