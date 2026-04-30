/**
 * Infere o tipo de relatório a partir do nome do arquivo.
 *
 * Regras (case-insensitive):
 *  • Contém "RFE" ou "financeiro" → FINANCEIRO_ESTATISTICO
 *  • Contém "REM" ou "movimentacao" ou "movimentação" → EST_MOVIMENTACAO
 *  • Caso contrário → null (não identificado)
 */
export type TipoRelatorioHint = 'FINANCEIRO_ESTATISTICO' | 'EST_MOVIMENTACAO' | null;

export function inferirTipo(nomeArquivo: string): TipoRelatorioHint {
  const nome = nomeArquivo.toUpperCase();

  // (?<![A-Z]) / (?![A-Z]) — não usa \b pois _ é considerado "palavra"
  // em JS, então "RFE_2024" falharia com \bRFE\b
  if (/(?<![A-Z])RFE(?![A-Z])/.test(nome) || nome.includes('FINANCEIRO')) {
    return 'FINANCEIRO_ESTATISTICO';
  }
  if (/(?<![A-Z])REM(?![A-Z])/.test(nome) || nome.includes('MOVIMENTAC')) {
    return 'EST_MOVIMENTACAO';
  }
  return null;
}

export const TIPO_LABEL: Record<NonNullable<TipoRelatorioHint>, string> = {
  FINANCEIRO_ESTATISTICO: 'RFE — Financeiro Estatístico',
  EST_MOVIMENTACAO: 'REM — Estatístico por Movimentação',
};
