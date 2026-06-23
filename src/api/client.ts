import api from '../lib/axios';
import type { Role } from '../types/admin';

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
  /** @deprecated usar ticket_medio_rotativo */
  ticket_medio: number;
  ticket_medio_rotativo: number | null;
  ticket_medio_mensalista: number | null;
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

/* ─── Comparativo Avançado ─── */

export type Granularidade = 'HORA' | 'DIA' | 'SEMANA' | 'MES';

export interface PeriodoComparativo {
  inicio: string;
  fim: string;
  label: string;
  dias_com_dados: number;
}

export interface ResumoComparativo {
  fluxo_total: number;
  media_por_hora: number;
  hora_pico: string | null;
  hora_vale: string | null;
  ticket_medio: number;
  receita: number;
  pagantes: number;
}

export interface DeltaResumo {
  fluxo_total_pct: number | null;
  media_por_hora_pct: number | null;
  ticket_medio_pct: number | null;
  receita_pct: number | null;
  pagantes_pct: number | null;
}

export interface SerieTemporal {
  chave: string;
  valor: number;
  label: string;
}

export interface HoraComparativo {
  faixa_horaria: string;
  valor_a: number;
  valor_b: number;
  delta_pct: number | null;
}

export interface HeatmapItem {
  dia_semana: number;
  faixa_horaria: string;
  valor_a: number;
  valor_b: number;
}

export interface ComparativoPeriodos {
  periodo_a: PeriodoComparativo;
  periodo_b: PeriodoComparativo;
  resumo_a: ResumoComparativo;
  resumo_b: ResumoComparativo;
  delta: DeltaResumo;
  serie_a: SerieTemporal[];
  serie_b: SerieTemporal[];
  por_hora: HoraComparativo[];
  heatmap: HeatmapItem[];
  granularidade: Granularidade;
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

  getAnaliseDiaSemana: (ano: number, mes: number) =>
    fetchJson<AnaliseDiaSemana[]>('/analise-dia-semana', { ano, mes }),

  getRankingInstituicoes: (ano: number, mes: number) =>
    fetchJson<RankingInstituicao[]>('/ranking', { ano, mes }),

  getAnaliseTolerancia: (ano: number, mes: number) =>
    fetchJson<ResumoTolerancia>('/analise-tolerancia', { ano, mes }),

  getPrevisao: (ano: number, mes: number) =>
    fetchJson<Previsao>('/previsao', { ano, mes }),

  getMeta: (ano: number, mes: number) =>
    fetchJson<MetaMensal>('/meta', { ano, mes }),

  salvarMeta: (data: { ano: number; mes: number; meta_fluxo?: number | null; meta_receita?: number | null }) =>
    api.post<MetaMensal>('/api/dashboard/meta', data).then(r => r.data),

  comparativo: (params: {
    inicioA: string; fimA: string;
    inicioB: string; fimB: string;
    granularidade?: Granularidade;
  }, signal?: AbortSignal) =>
    api.get<ComparativoPeriodos>('/api/dashboard/comparativo', { params, signal }).then(r => r.data),

  exportarComparativo: (params: {
    inicioA: string; fimA: string;
    inicioB: string; fimB: string;
    granularidade?: Granularidade;
    formato: 'XLSX' | 'PDF' | 'CSV';
  }) =>
    api.get('/api/dashboard/comparativo/exportar', {
      params,
      responseType: 'blob',
    }).then(r => r.data as Blob),
};

export interface Instituicao {
  id: number;
  nome: string;
  cnpj: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface UsuarioAdmin {
  id: number;
  instituicao_id: number;
  nome_instituicao: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  criado_em: string;
  ultimo_login: string | null;
}

export const adminApi = {
  listInstituicoes: () =>
    api.get<Instituicao[]>('/api/admin/instituicoes').then(r => r.data),

  createInstituicao: (data: { nome: string; cnpj?: string }) =>
    api.post<Instituicao>('/api/admin/instituicoes', data).then(r => r.data),

  updateInstituicao: (id: number, data: { nome: string; cnpj?: string; ativo?: boolean }) =>
    api.put<Instituicao>(`/api/admin/instituicoes/${id}`, data).then(r => r.data),

  listUsuarios: (page = 0, size = 50) =>
    api.get<{ content: UsuarioAdmin[]; total_elements: number; total_pages: number; number: number }>(
      `/api/admin/usuarios?page=${page}&size=${size}&sort=nome,asc`
    ).then(r => r.data),

  createUsuario: (data: { instituicao_id: number; nome: string; email: string; senha: string; role: Role }) =>
    api.post<UsuarioAdmin>('/api/admin/usuarios', data).then(r => r.data),

  updateUsuario: (id: number, data: { nome: string; role?: Role; ativo?: boolean }) =>
    api.put<UsuarioAdmin>(`/api/admin/usuarios/${id}`, data).then(r => r.data),
};

export interface OcorrenciaProcessamento {
  severidade: string;
  codigo: string;
  campo: string | null;
  mensagem: string;
}

export interface ProcessamentoResultado {
  arquivo_processado_id: number | null;
  nome_arquivo: string;
  status: string;
  mensagem: string | null;
  quantidade_erros: number;
  quantidade_avisos: number;
  ocorrencias: OcorrenciaProcessamento[];
}

export interface AnaliseDiaSemana {
  dia_semana: string;
  media_fluxo: number;
  total_fluxo: number;
  media_receita: number;
  total_receita: number;
  media_pagantes: number;
  total_tolerancia: number;
  qtd_dias: number;
}

export interface RankingInstituicao {
  posicao: number;
  instituicao_id: number;
  nome_instituicao: string;
  fluxo_total: number;
  receita_total: number;
  pagantes_total: number;
  ticket_medio: number;
  dias_com_dados: number;
}

export interface ResumoTolerancia {
  total_entradas: number;
  total_tolerancia: number;
  total_pagantes: number;
  pct_tolerancia: number;
  pct_pagantes: number;
  detalhe: AnaliseToleranciaDia[];
}

export interface AnaliseToleranciaDia {
  data: string;
  dia_semana: string;
  total_entradas: number;
  pagantes: number;
  tolerancia: number;
  tolerancia_pct: number;
  credenciado: number;
  mensalista: number;
}

export interface Previsao {
  ano_previsao: number;
  mes_previsao: number;
  mes_nome: string;
  previsao_fluxo: number;
  previsao_receita: number;
  previsao_ticket_medio: number;
  base_calculo: string;
  meses_utilizados: number;
}

export interface MetaMensal {
  id: number | null;
  ano: number;
  mes: number;
  meta_fluxo: number | null;
  meta_receita: number | null;
  fluxo_realizado: number;
  receita_realizada: number;
  pct_fluxo: number | null;
  pct_receita: number | null;
}

export interface ContaResumo {
  id: number;
  nome: string;
  plano: string;
  planoPendente: string | null;
  maxInstituicoes: number;
  maxUsuariosPorInstituicao: number;
  dataInicioPlano: string;
  dataVencimento: string;
  ciclo: string;
  ativo: boolean;
  qtdInstituicoes: number;
}

export interface HistoricoPlanoItem {
  id: number;
  planoAnterior: string;
  planoNovo: string;
  motivo: string;
  dataAlteracao: string;
  alteradoPor: string | null;
  valorCobrado: number | null;
}

export const contaApi = {
  listar: () =>
    api.get<ContaResumo[]>('/api/admin/contas').then(r => r.data),

  buscar: (id: number) =>
    api.get<ContaResumo>(`/api/admin/contas/${id}`).then(r => r.data),

  criar: (nome: string, plano: string) =>
    api.post<ContaResumo>('/api/admin/contas', { nome, plano }).then(r => r.data),

  alterarPlano: (id: number, plano: string, valorCobrado?: number) =>
    api.put<ContaResumo>(`/api/admin/contas/${id}/plano`, { plano, valorCobrado }).then(r => r.data),

  alterarVencimento: (id: number, dataVencimento: string) =>
    api.put<ContaResumo>(`/api/admin/contas/${id}/vencimento`, { dataVencimento }).then(r => r.data),

  historico: (id: number) =>
    api.get<HistoricoPlanoItem[]>(`/api/admin/contas/${id}/historico`).then(r => r.data),

  listarInstituicoes: (id: number) =>
    api.get<{ id: number; nome: string; cnpj: string | null; ativo: boolean }[]>(
      `/api/admin/contas/${id}/instituicoes`
    ).then(r => r.data),
};

export interface InstituicaoPlanoAdmin {
  id: number;
  nome: string;
  cnpj: string | null;
  plano: string;
  maxUsuariosPorInstituicao: number;
  ativo: boolean;
}

export const planoApi = {
  listInstituicoesComPlano: () =>
    api.get<InstituicaoPlanoAdmin[]>('/api/admin/planos').then(r => r.data),

  updatePlanoInstituicao: (id: number, plano: string) =>
    api.put<InstituicaoPlanoAdmin>(`/api/admin/planos/instituicao/${id}`, { plano }).then(r => r.data),
};

export type ImportacaoJob = {
  id: number;
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
  mensagem: string | null;
  nomeArquivo: string | null;
  instituicaoId: number | null;
};

export type TipoRelatorio = 'FINANCEIRO_ESTATISTICO' | 'EST_MOVIMENTACAO';

export type ArquivoProcessadoStatus =
  | 'PENDENTE' | 'TEXTO_EXTRAIDO' | 'IA_PROCESSADA' | 'PROCESSANDO'
  | 'PROCESSADO' | 'PROCESSADO_COM_AVISOS' | 'ERRO_VALIDACAO' | 'ERRO_PROCESSAMENTO';

export interface ArquivoUploadItem {
  id: number;
  nome_arquivo: string;
  tipo_relatorio: TipoRelatorio | null;
  status_processamento: ArquivoProcessadoStatus;
  criado_em: string;
  finalizado_em: string | null;
  /** Data em que o registro foi gravado (data_referencia); onde o arquivo "caiu". */
  data_referencia: string | null;
  /** Data extraída do nome do arquivo (fonte autoritativa); null se não parseável. */
  data_nome_arquivo: string | null;
  /** true quando a data gravada diverge da data do nome do arquivo (registro mal-datado). */
  data_divergente: boolean;
}

export interface DiaUpload {
  data_referencia: string;
  status_dia: 'COMPLETO' | 'PENDENTE';
  arquivos: ArquivoUploadItem[];
}

export interface HistoricoUpload {
  resumo: {
    total_dias: number;
    dias_completos: number;
    dias_pendentes: number;
  };
  dias: DiaUpload[];
}

export const importacaoApi = {
  criarJob: (file: File, instituicaoId?: number | null) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ job_id?: number; jobId?: number; status: string }>('/api/importacao/jobs', form, {
      // Não definir Content-Type manualmente: o browser define automaticamente
      // incluindo o boundary correto para multipart/form-data.
      params: instituicaoId ? { instituicaoId } : undefined,
    }).then(r => {
      // Normaliza o ID independente de o backend retornar job_id ou jobId
      // (comportamento do Jackson com Map<String,Object> varia por versão)
      const raw = r.data as Record<string, unknown>;
      const id = (raw['job_id'] ?? raw['jobId']) as number | undefined;
      return { job_id: id, status: raw['status'] as string };
    });
  },

  consultarJob: (jobId: number) =>
    api.get<ImportacaoJob>(`/api/importacao/jobs/${jobId}`).then(r => r.data),

  historico: (ano: number, mes: number, instituicaoId?: number | null) =>
    api.get<HistoricoUpload>('/api/importacao/historico', {
      params: { ano, mes, ...(instituicaoId ? { instituicaoId } : {}) },
    }).then(r => r.data),

  /**
   * Apaga com segurança um arquivo mal-datado (data divergente) para que possa ser
   * reenviado e reimportado na data correta. Falha (409/erro de negócio) se a data
   * atual não for um dia-fantasma — protegendo os fatos compartilhados.
   */
  corrigirDataArquivo: (id: number, instituicaoId?: number | null) =>
    api.post<{ removido: string; reenviar: boolean; mensagem: string }>(
      `/api/admin/manutencao/arquivo/${id}/corrigir-data`,
      null,
      { params: instituicaoId ? { instituicaoId } : undefined },
    ).then(r => r.data),

  /**
   * Apaga TODOS os arquivos de uma data (REM + RFE) e seus dados/fatos, liberando os
   * hashes. Usado quando a correção simples é bloqueada por o dia ter outro arquivo
   * legítimo (fatos compartilhados): limpa o dia para reenviar cada um na data certa.
   */
  apagarDia: (data: string, instituicaoId?: number | null) =>
    api.post<{ removidos: number; arquivos: string[]; reenviar: boolean; mensagem: string }>(
      '/api/admin/manutencao/dia/apagar',
      null,
      { params: { data, ...(instituicaoId ? { instituicaoId } : {}) } },
    ).then(r => r.data),

  /**
   * Lista, em todas as datas, os arquivos mal-datados (data gravada ≠ data do nome).
   * Usado para localizar de uma vez onde cada arquivo caiu.
   */
  arquivosMalDatados: (instituicaoId?: number | null) =>
    api.get<ArquivoUploadItem[]>('/api/importacao/historico/mal-datados', {
      params: instituicaoId ? { instituicaoId } : undefined,
    }).then(r => r.data),
};
