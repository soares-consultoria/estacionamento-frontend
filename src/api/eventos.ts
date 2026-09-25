import api from '../lib/axios';

export type CategoriaEvento =
  | 'CINEMA' | 'EXPOSICAO' | 'SHOW' | 'PROMOCAO' | 'FERIADO' | 'PARCERIA' | 'OUTRO';

// snake_case: backend serializa em SNAKE_CASE (JacksonConfig global).
export interface Evento {
  id: number;
  titulo: string;
  categoria: CategoriaEvento;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD
  descricao: string | null;
  criado_em: string;
  atualizado_em: string;
  fluxo_pico: number | null;  // maior fluxo diário no período (null sem dados)
  impacto_pct: number | null; // variação vs. média dos dias sem evento (null sem dados/base)
}

export interface EventoInput {
  titulo: string;
  categoria: CategoriaEvento;
  data_inicio: string;
  data_fim: string;
  descricao?: string | null;
}

// Análise de impacto (snake_case).
export interface EventoImpactoDia {
  data: string;
  dia: number;
  fluxo: number;
  receita: number;
  tem_evento: boolean;
  eventos: string[];
}
export interface EventoImpactoItem {
  id: number;
  titulo: string;
  categoria: CategoriaEvento;
  data_inicio: string;
  data_fim: string;
  fluxo_pico: number;
  impacto_pct: number | null;
}
export interface EventoImpacto {
  ano: number;
  mes: number;
  dias: EventoImpactoDia[];
  media_fluxo_base: number;
  media_receita_base: number;
  maior_pico_fluxo: number;
  maior_pico_data: string | null;
  maior_pico_evento: string | null;
  impacto_medio_pct: number | null;
  receita_extra_estimada: number;
  eventos: EventoImpactoItem[];
}

export const eventosApi = {
  listar: (inicio?: string, fim?: string) =>
    api.get<Evento[]>('/api/eventos', {
      params: inicio && fim ? { inicio, fim } : undefined,
    }).then(r => r.data),

  criar: (data: EventoInput) =>
    api.post<Evento>('/api/eventos', data).then(r => r.data),

  atualizar: (id: number, data: EventoInput) =>
    api.put<Evento>(`/api/eventos/${id}`, data).then(r => r.data),

  excluir: (id: number) =>
    api.delete<void>(`/api/eventos/${id}`).then(r => r.data),

  impacto: (ano: number, mes: number) =>
    api.get<EventoImpacto>('/api/eventos/impacto', { params: { ano, mes } }).then(r => r.data),
};

export const CATEGORIAS: { valor: CategoriaEvento; label: string; emoji: string }[] = [
  { valor: 'CINEMA', label: 'Cinema', emoji: '🎬' },
  { valor: 'EXPOSICAO', label: 'Exposição', emoji: '🦖' },
  { valor: 'SHOW', label: 'Show', emoji: '🎤' },
  { valor: 'PROMOCAO', label: 'Promoção', emoji: '🏷️' },
  { valor: 'FERIADO', label: 'Feriado', emoji: '🎉' },
  { valor: 'PARCERIA', label: 'Parceria', emoji: '🤝' },
  { valor: 'OUTRO', label: 'Outro', emoji: '📌' },
];

export const CATEGORIA_INFO: Record<CategoriaEvento, { label: string; emoji: string; chip: string }> = {
  CINEMA: { label: 'Cinema', emoji: '🎬', chip: 'bg-violet-100 text-violet-700' },
  EXPOSICAO: { label: 'Exposição', emoji: '🦖', chip: 'bg-blue-100 text-blue-700' },
  SHOW: { label: 'Show', emoji: '🎤', chip: 'bg-red-100 text-red-700' },
  PROMOCAO: { label: 'Promoção', emoji: '🏷️', chip: 'bg-emerald-100 text-emerald-700' },
  FERIADO: { label: 'Feriado', emoji: '🎉', chip: 'bg-amber-100 text-amber-700' },
  PARCERIA: { label: 'Parceria', emoji: '🤝', chip: 'bg-amber-100 text-amber-700' },
  OUTRO: { label: 'Outro', emoji: '📌', chip: 'bg-slate-100 text-slate-600' },
};
