import api from '../lib/axios';

async function fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const { data } = await api.get<T>(`/api/dashboard${path}`, { params });
  return data;
}

export interface KpiMensal {
  mes: string;
  fluxo_total: number;
  fluxo_variacao_pct: number | null;
  receita_total: number;
  receita_variacao_pct: number | null;
  pagantes_total: number;
  ticket_medio: number;
  dias_com_dados: number;
}

export interface FluxoDiario {
  data: string;
  dia_semana: string;
  rotativo_entradas: number;
  credenciado_entradas: number;
  mensalista_entradas: number;
  total_entradas: number;
  pagantes: number;
  tolerancia: number;
  faturamento: number;
  arrecadacao: number;
}

export interface ReceitaDiaria {
  data: string;
  dia_semana: string;
  faturamento: number;
  arrecadacao: number;
  descontos: number;
}

export interface MovimentacaoHoraria {
  faixa_horaria: string;
  rotativo_entradas: number;
  rotativo_saidas: number;
  credenciado_entradas: number;
  credenciado_saidas: number;
  mensalista_entradas: number;
  mensalista_saidas: number;
  cdeb_entradas: number;
  cdeb_saidas: number;
  total_entradas: number;
  total_saidas: number;
}

export interface DesempenhoAnual {
  ano: number;
  mes_numero: number;
  mes_nome: string;
  fluxo_total: number;
  receita_total: number;
  pagantes_total: number;
  ticket_medio: number;
}

export interface ArrecadacaoTipo {
  tipo_pagamento: string;
  valor_total: number;
  quantidade: number;
}

export interface FluxoDiarioVeiculo {
  data: string;
  dia_semana: string;
  rot_carros: number;   rot_motos: number;   rot_caminhoes: number;
  rot_terceiros: number; rot_cdeb: number;
  cred_carros: number;  cred_motos: number;  cred_caminhoes: number;
  mens_carros: number;  mens_motos: number;  mens_caminhoes: number;
  total_carros: number; total_motos: number; total_caminhoes: number;
  total_entradas: number;
}

export interface FluxoHorarioVeiculo {
  faixa_horaria: string;
  rot_carros_ent: number;  rot_motos_ent: number;  rot_caminhoes_ent: number;
  rot_terceiros_ent: number; rot_cdeb_ent: number;
  rot_carros_sai: number;  rot_motos_sai: number;  rot_caminhoes_sai: number;
  rot_terceiros_sai: number; rot_cdeb_sai: number;
  cred_carros_ent: number; cred_motos_ent: number; cred_caminhoes_ent: number;
  cred_carros_sai: number; cred_motos_sai: number; cred_caminhoes_sai: number;
  mens_carros_ent: number; mens_motos_ent: number; mens_caminhoes_ent: number;
  mens_carros_sai: number; mens_motos_sai: number; mens_caminhoes_sai: number;
  total_carros_ent: number; total_motos_ent: number; total_entradas: number;
  total_carros_sai: number; total_motos_sai: number; total_saidas: number;
}

export const dashboardApi = {
  getKpiMensal: (ano: number, mes: number) =>
    fetchJson<KpiMensal>('/kpi-mensal', { ano, mes }),

  getFluxoDiario: (ano: number, mes: number) =>
    fetchJson<FluxoDiario[]>('/fluxo-diario', { ano, mes }),

  getReceitaDiaria: (ano: number, mes: number) =>
    fetchJson<ReceitaDiaria[]>('/receita-diaria', { ano, mes }),

  getMovimentacaoHoraria: (data: string) =>
    fetchJson<MovimentacaoHoraria[]>('/movimentacao-horaria', { data }),

  getDesempenhoAnual: (ano: number) =>
    fetchJson<DesempenhoAnual[]>('/desempenho-anual', { ano }),

  getArrecadacaoPorTipo: (ano: number, mes: number) =>
    fetchJson<ArrecadacaoTipo[]>('/arrecadacao-tipo', { ano, mes }),

  getFluxoDiarioVeiculo: (ano: number, mes: number) =>
    fetchJson<FluxoDiarioVeiculo[]>('/fluxo-diario-veiculo', { ano, mes }),

  getFluxoHorarioVeiculo: (data: string) =>
    fetchJson<FluxoHorarioVeiculo[]>('/fluxo-horario-veiculo', { data }),
};
