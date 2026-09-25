import api from '../lib/axios';

// snake_case: backend serializa em SNAKE_CASE.
export interface PermanenciaFaixa {
  faixa: string;
  total: number;
  rotativo: number;
  cred_mens: number;
  cartao_debito: number;
  ponto_medio_minutos: number | null;
  pct: number;
}

export interface Permanencia {
  ano: number;
  mes: number | null;
  total_veiculos: number;
  permanencia_media_minutos: number | null;
  permanencia_media_label: string | null;
  rotativo_media_minutos: number | null;
  rotativo_media_label: string | null;
  cred_mens_media_minutos: number | null;
  cred_mens_media_label: string | null;
  faixa_mais_comum: string | null;
  total_rotativo: number;
  total_cred_mens: number;
  total_cartao_debito: number;
  faixas: PermanenciaFaixa[];
}

export const permanenciaApi = {
  get: (ano: number, mes?: number) =>
    api.get<Permanencia>('/api/permanencia', { params: { ano, ...(mes ? { mes } : {}) } }).then(r => r.data),
};
