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
          <span>会话</span>
          <code title={sessionId}>{sessionId.slice(0, 12)}…</code>
        </div>
        <div className="meta-row">
          <span>状态</span>
          <span className={streaming ? 'badge live' : 'badge idle'}>
            {streaming ? '生成中' : '在线'}
          </span>
        </div>
        <div className="meta-row">
          <span>模式</span>
          <span className="badge mock">智能问答</span>
        </div>
      </div>

      <div className="sidebar-foot">
        <p className="foot-note">回答由 AI 生成，仅供参考，请以店铺官方政策为准。</p>
        <button className="foot-link" type="button">
          需要人工帮助？联系客服 →
        </button>
      </div>
    </aside>
  );
}
