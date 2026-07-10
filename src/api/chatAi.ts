import api from '../lib/axios';

export interface ConversaResumo {
  id: string;
  titulo: string | null;
  criadoEm: string;
}

export interface Mensagem {
  papel: 'user' | 'assistant';
  conteudo: string;
  criadoEm: string;
}

export interface ConversaDetalhe {
  id: string;
  titulo: string | null;
  criadoEm: string;
  mensagens: Mensagem[];
}

export interface Uso {
  periodo: string;
  consumido: number;
  cotaMensal: number | null;
  limiteAbsoluto: number | null;
  permiteExcedente: boolean;
  excedente: number;
  percentual: number | null;
}

export interface DonePayload {
  conversaId: string;
  tokensPrompt: number;
  tokensCompletion: number;
  percentualCota: number | null;
}

export interface StreamCallbacks {
  onDelta: (chunk: string) => void;
  onDone: (payload: DonePayload) => void;
  onErro: (mensagem: string, codigo?: string) => void;
}

export async function listarConversas(): Promise<ConversaResumo[]> {
  const { data } = await api.get<ConversaResumo[]>('/api/chat-ai/conversas');
  return data;
}

export async function obterConversa(id: string): Promise<ConversaDetalhe> {
  const { data } = await api.get<ConversaDetalhe>(`/api/chat-ai/conversas/${id}`);
  return data;
}

export async function obterUso(): Promise<Uso> {
  const { data } = await api.get<Uso>('/api/chat-ai/uso');
  return data;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8181/estacionamento-api';

/** instituicaoId selecionado (SUPER_ADMIN/SISTEMA_ADMIN), como no interceptor do axios. */
function instituicaoIdParaAdmin(): string | null {
  const auth = localStorage.getItem('auth');
  if (!auth) return null;
  try {
    const user = JSON.parse(auth) as { role?: string };
    if (user.role === 'SUPER_ADMIN' || user.role === 'SISTEMA_ADMIN') {
      return localStorage.getItem('selectedInstituicaoId');
    }
  } catch {
    // ignora
  }
  return null;
}

/**
 * Envia a mensagem e consome a resposta via SSE com fetch + ReadableStream
 * (EventSource não suporta header Authorization). Suporta cancelamento via signal.
 */
export async function enviarMensagem(
  conversaId: string | null,
  mensagem: string,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('token');
  const instId = instituicaoIdParaAdmin();
  const query = instId ? `?instituicaoId=${encodeURIComponent(instId)}` : '';

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/chat-ai/mensagens${query}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // application/json também: respostas de erro (403/429) do backend são JSON —
        // sem isso, o endpoint (produces=text/event-stream) devolve 406.
        Accept: 'text/event-stream, application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // snake_case: o backend usa property-naming SNAKE_CASE (conversa_id).
      body: JSON.stringify({ conversa_id: conversaId, mensagem }),
      signal,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
    cb.onErro('Falha de conexão com o assistente.');
    return;
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    window.location.href = `${import.meta.env.BASE_URL}login`;
    return;
  }

  if (!res.ok || !res.body) {
    let msg = 'Não foi possível falar com o assistente.';
    let codigo: string | undefined;
    try {
      const err = await res.json();
      if (err?.mensagem) msg = err.mensagem;
      if (err?.erro) codigo = err.erro;
    } catch {
      // resposta sem corpo JSON
    }
    cb.onErro(msg, codigo);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const bloco = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        processarEvento(bloco, cb);
      }
    }
  } catch (e) {
    if ((e as Error)?.name !== 'AbortError') {
      cb.onErro('A transmissão da resposta foi interrompida.');
    }
  }
}

function processarEvento(bloco: string, cb: StreamCallbacks) {
  let evento = 'message';
  const dados: string[] = [];
  for (const linha of bloco.split('\n')) {
    if (linha.startsWith('event:')) {
      evento = linha.slice(6).trim();
    } else if (linha.startsWith('data:')) {
      dados.push(linha.slice(5).replace(/^ /, ''));
    }
  }
  const data = dados.join('\n');
  if (evento === 'delta') {
    cb.onDelta(data);
  } else if (evento === 'done') {
    try {
      cb.onDone(JSON.parse(data) as DonePayload);
    } catch {
      // done sem payload válido — ignora
    }
  } else if (evento === 'erro') {
    cb.onErro(data || 'Erro no assistente.');
  }
}
