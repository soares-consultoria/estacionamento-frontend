import { useEffect, useRef, useState } from 'react';
import { History, Plus, Sparkles, X } from 'lucide-react';
import {
  enviarMensagem,
  listarConversas,
  obterConversa,
  obterUso,
  type ConversaResumo,
  type Uso,
} from '../../api/chatAi';
import ChatAiMensagem from './ChatAiMensagem';
import ChatAiInput from './ChatAiInput';
import ChatAiUsoBar from './ChatAiUsoBar';

type Msg = { papel: 'user' | 'assistant'; conteudo: string };
type Erro = { mensagem: string; codigo?: string };

export default function ChatAiWidget() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [uso, setUso] = useState<Uso | null>(null);
  const [erro, setErro] = useState<Erro | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [conversas, setConversas] = useState<ConversaResumo[]>([]);

  const streamingRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) {
      obterUso().then(setUso).catch(() => setUso(null));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, streaming]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aberto) setAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto]);

  const enviar = () => {
    const texto = input.trim();
    if (!texto || enviando) return;
    setErro(null);
    setMensagens((prev) => [...prev, { papel: 'user', conteudo: texto }]);
    setInput('');
    setEnviando(true);
    streamingRef.current = '';
    setStreaming('');

    const ac = new AbortController();
    abortRef.current = ac;

    void enviarMensagem(
      conversaId,
      texto,
      {
        onDelta: (chunk) => {
          streamingRef.current += chunk;
          setStreaming(streamingRef.current);
        },
        onDone: (payload) => {
          finalizarStreaming();
          setConversaId(payload.conversaId);
          if (payload.percentualCota != null) {
            setUso((u) => (u ? { ...u, percentual: payload.percentualCota } : u));
          }
        },
        onErro: (mensagem, codigo) => {
          setEnviando(false);
          streamingRef.current = '';
          setStreaming('');
          setErro({ mensagem, codigo });
        },
      },
      ac.signal,
    );
  };

  const finalizarStreaming = () => {
    const txt = streamingRef.current;
    if (txt) {
      setMensagens((prev) => [...prev, { papel: 'assistant', conteudo: txt }]);
    }
    streamingRef.current = '';
    setStreaming('');
    setEnviando(false);
  };

  const parar = () => {
    abortRef.current?.abort();
    finalizarStreaming();
  };

  const novaConversa = () => {
    abortRef.current?.abort();
    setMensagens([]);
    setConversaId(null);
    setErro(null);
    streamingRef.current = '';
    setStreaming('');
    setEnviando(false);
    setMostrarHistorico(false);
  };

  const abrirHistorico = async () => {
    setMostrarHistorico(true);
    try {
      setConversas(await listarConversas());
    } catch {
      setConversas([]);
    }
  };

  const carregarConversa = async (id: string) => {
    try {
      const c = await obterConversa(id);
      setMensagens(c.mensagens.map((m) => ({ papel: m.papel, conteudo: m.conteudo })));
      setConversaId(c.id);
      setErro(null);
      setMostrarHistorico(false);
    } catch {
      setErro({ mensagem: 'Não foi possível carregar a conversa.' });
    }
  };

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir o Assistente GestãoNaMão.ai"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center"
      >
        <Sparkles size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full h-full sm:w-[400px] sm:h-[600px] sm:max-h-[80vh] sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col bg-white">
      {/* Header */}
      <div className="bg-[#1e293b] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Assistente GestãoNaMão.ai</p>
            <p className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Conectado aos seus indicadores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={abrirHistorico} aria-label="Histórico de conversas"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300">
            <History size={16} />
          </button>
          <button type="button" onClick={novaConversa} aria-label="Nova conversa"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300">
            <Plus size={16} />
          </button>
          <button type="button" onClick={() => setAberto(false)} aria-label="Fechar"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3 relative">
        {mostrarHistorico ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 px-1 pb-1">Conversas anteriores</p>
            {conversas.length === 0 && <p className="text-sm text-slate-400 px-1">Nenhuma conversa ainda.</p>}
            {conversas.map((c) => (
              <button key={c.id} type="button" onClick={() => carregarConversa(c.id)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-sm text-slate-700 truncate">
                {c.titulo ?? 'Conversa'}
              </button>
            ))}
          </div>
        ) : (
          <>
            {mensagens.length === 0 && !streaming && (
              <div className="text-center text-slate-400 text-sm mt-8 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Sparkles size={22} className="text-white" />
                </div>
                Pergunte sobre faturamento, fluxo de veículos, tickets, mensalistas ou metas.
              </div>
            )}
            {mensagens.map((m, i) => (
              <ChatAiMensagem key={i} papel={m.papel} conteudo={m.conteudo} />
            ))}
            {streaming && <ChatAiMensagem papel="assistant" conteudo={streaming} />}
            {enviando && !streaming && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm px-3 py-2.5 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {erro.mensagem}
                {erro.codigo === 'CHAT_AI_COTA_EXCEDIDA' && (
                  <p className="mt-1 font-semibold">Fale com o administrador da sua conta.</p>
                )}
              </div>
            )}
            <div ref={fimRef} />
          </>
        )}
      </div>

      {/* Rodapé */}
      {!mostrarHistorico && (
        <div className="flex-shrink-0">
          <ChatAiUsoBar percentual={uso?.percentual ?? null} />
          <ChatAiInput
            value={input}
            onChange={setInput}
            onSend={enviar}
            onStop={parar}
            enviando={enviando}
            inputRef={inputRef}
          />
        </div>
      )}
    </div>
  );
}
