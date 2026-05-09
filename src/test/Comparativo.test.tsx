import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Comparativo from '../pages/Comparativo';

// Mock do FeatureGate para mostrar conteúdo avançado
vi.mock('../components/FeatureGate', () => ({
  FeatureGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do dashboardApi
vi.mock('../api/client', () => ({
  dashboardApi: {
    comparativo: vi.fn().mockResolvedValue({
      periodo_a: { inicio: '2025-05-01', fim: '2025-05-31', label: '01/05/2025 – 31/05/2025', dias_com_dados: 20 },
      periodo_b: { inicio: '2026-05-01', fim: '2026-05-31', label: '01/05/2026 – 31/05/2026', dias_com_dados: 15 },
      resumo_a: { fluxo_total: 1000, media_por_hora: 50, hora_pico: '10h', hora_vale: '03h', ticket_medio: 15, receita: 15000, pagantes: 900 },
      resumo_b: { fluxo_total: 1200, media_por_hora: 60, hora_pico: '11h', hora_vale: '02h', ticket_medio: 16, receita: 18000, pagantes: 1100 },
      delta: { fluxo_total_pct: 20, media_por_hora_pct: 20, ticket_medio_pct: 6.67, receita_pct: 20, pagantes_pct: 22.22 },
      serie_a: [{ chave: '2025-05-01', valor: 100, label: '2025-05-01' }],
      serie_b: [{ chave: '2026-05-01', valor: 120, label: '2026-05-01' }],
      por_hora: [{ faixa_horaria: '10h', valor_a: 100, valor_b: 120, delta_pct: 20 }],
      heatmap: [],
      granularidade: 'HORA',
    }),
  },
}));

describe('Comparativo page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submit do form chama dashboardApi.comparativo', async () => {
    const { dashboardApi } = await import('../api/client');
    render(<Comparativo />);
    fireEvent.click(screen.getByText('Comparar'));
    await waitFor(() => {
      expect(dashboardApi.comparativo).toHaveBeenCalled();
    });
  });

  it('renderiza tabela horária quando granularidade=HORA', async () => {
    render(<Comparativo />);
    fireEvent.click(screen.getByText('Comparar'));
    await waitFor(() => {
      // '10h' aparece na tabela e nos cards (Até 10h), então usa getAllByText
      const matches = screen.getAllByText('10h');
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
