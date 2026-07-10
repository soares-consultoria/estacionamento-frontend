import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  papel: 'user' | 'assistant';
  conteudo: string;
  /** id da mensagem persistida (só respostas do assistente) — habilita o feedback. */
  mensagemId?: number;
  feedback?: number | null; // 1 = 👍, -1 = 👎
  onAvaliar?: (mensagemId: number, valor: number) => void;
}

/** Negrito markdown básico (**texto**) + quebras de linha, sem lib externa. */
function renderConteudo(texto: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

export default function ChatAiMensagem({ papel, conteudo, mensagemId, feedback, onAvaliar }: Props) {
  const isUser = papel === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm whitespace-pre-wrap break-words">
          {renderConteudo(conteudo)}
        </div>
      </div>
    );
  }

  const podeAvaliar = mensagemId != null && onAvaliar != null;
  // clicar no mesmo voto de novo limpa a avaliação (toggle → valor 0)
  const votar = (valor: number) => {
    if (mensagemId != null && onAvaliar) onAvaliar(mensagemId, feedback === valor ? 0 : valor);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mt-0.5">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="max-w-[80%]">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm px-3.5 py-2 text-sm text-slate-800 whitespace-pre-wrap break-words">
          {renderConteudo(conteudo)}
        </div>
        {podeAvaliar && (
          <div className="flex items-center gap-1 mt-1 pl-1">
            <button
              type="button"
              onClick={() => votar(1)}
              aria-label="Gostei da resposta"
              title="Gostei"
              className={`p-1 rounded transition-colors ${
                feedback === 1 ? 'text-green-600' : 'text-slate-300 hover:text-slate-500'
              }`}
            >
              <ThumbsUp size={14} fill={feedback === 1 ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => votar(-1)}
              aria-label="Não gostei da resposta"
              title="Não gostei"
              className={`p-1 rounded transition-colors ${
                feedback === -1 ? 'text-red-500' : 'text-slate-300 hover:text-slate-500'
              }`}
            >
              <ThumbsDown size={14} fill={feedback === -1 ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
