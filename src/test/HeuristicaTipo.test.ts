import { describe, it, expect } from 'vitest';
import { inferirTipo } from '../components/upload/HeuristicaTipo';

describe('inferirTipo', () => {
  it.each([
    ['RFE_2024_01.pdf', 'FINANCEIRO_ESTATISTICO'],
    ['relatorio-rfe-jan.pdf', 'FINANCEIRO_ESTATISTICO'],
    ['RELATORIO_FINANCEIRO_2024.pdf', 'FINANCEIRO_ESTATISTICO'],
    ['financeiro_estatistico_jan24.pdf', 'FINANCEIRO_ESTATISTICO'],
  ])('identifica RFE: %s', (nome, expected) => {
    expect(inferirTipo(nome)).toBe(expected);
  });

  it.each([
    ['REM_2024_01.pdf', 'EST_MOVIMENTACAO'],
    ['relatorio-rem-jan.pdf', 'EST_MOVIMENTACAO'],
    ['movimentacao_jan2024.pdf', 'EST_MOVIMENTACAO'],
    ['EST_MOVIMENTACAO_2024.pdf', 'EST_MOVIMENTACAO'],
  ])('identifica REM: %s', (nome, expected) => {
    expect(inferirTipo(nome)).toBe(expected);
  });

  it.each([
    ['arquivo.pdf'],
    ['relatorio_2024.pdf'],
    ['upload_teste.pdf'],
  ])('retorna null para arquivo sem pista: %s', (nome) => {
    expect(inferirTipo(nome)).toBeNull();
  });
});
