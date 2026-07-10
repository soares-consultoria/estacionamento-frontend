import { Send, Square } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  enviando: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatAiInput({ value, onChange, onSend, onStop, enviando, inputRef }: Props) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? localRef;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!enviando && value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-slate-200 bg-white">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Pergunte sobre faturamento, fluxo, metas…"
        aria-label="Mensagem para o assistente"
        className="flex-1 resize-none max-h-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {enviando ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Parar geração"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
        >
          <Square size={15} className="text-slate-700" fill="currentColor" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim()}
          aria-label="Enviar mensagem"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 disabled:opacity-50 flex items-center justify-center hover:shadow-md transition"
        >
          <Send size={15} className="text-white" />
        </button>
      )}
    </div>
  );
}
