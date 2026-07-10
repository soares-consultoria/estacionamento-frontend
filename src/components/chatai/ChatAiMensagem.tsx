import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  papel: 'user' | 'assistant';
  conteudo: string;
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

export default function ChatAiMensagem({ papel, conteudo }: Props) {
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

  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mt-0.5">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="max-w-[80%] bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm px-3.5 py-2 text-sm text-slate-800 whitespace-pre-wrap break-words">
        {renderConteudo(conteudo)}
      </div>
    </div>
  );
}
