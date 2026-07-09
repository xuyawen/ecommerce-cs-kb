import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  streaming: boolean;
}

export function Composer({ value, onChange, onSend, streaming }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!value.trim() || streaming) return;
    onSend(value.trim());
    onChange('');
    if (ref.current) ref.current.style.height = 'auto';
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoGrow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  return (
    <div className="composer">
      <textarea
        ref={ref}
        value={value}
        onChange={autoGrow}
        onKeyDown={onKeyDown}
        placeholder={streaming ? '生成中…（可继续输入，回车发送）' : '输入问题，Enter 发送，Shift+Enter 换行'}
        rows={1}
      />
      <button className="send" onClick={submit} disabled={streaming || !value.trim()}>
        {streaming ? '…' : '发送'}
      </button>
    </div>
  );
}
