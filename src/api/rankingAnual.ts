import api from '../lib/axios';

export type MetricaRanking = 'FLUXO' | 'RECEITA';

// snake_case: backend serializa em SNAKE_CASE.
export interface RankingAnualItem {
  posicao: number;
  data: string; // YYYY-MM-DD
  dia_semana: string;
  fluxo: number;
  receita: number;
}

export interface RankingAnual {
  ano: number;
  metrica: MetricaRanking;
  itens: RankingAnualItem[];
  media_diaria_fluxo: number;
  media_diaria_receita: number;
  melhor_mes_numero: number | null;
  melhor_mes_nome: string | null;
  melhor_mes_fluxo: number;
  melhor_mes_receita: number;
}

export const rankingAnualApi = {
  get: (ano: number, metrica: MetricaRanking, limite = 10) =>
    api.get<RankingAnual>('/api/ranking-anual', { params: { ano, metrica, limite } }).then(r => r.data),
};
