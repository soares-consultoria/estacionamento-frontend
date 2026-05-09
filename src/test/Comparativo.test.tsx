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
      periodoA: { inicio: '2025-05-01', fim: '2025-05-31', label: '01/05/2025 – 31/05/2025', diasComDados: 20 },
      periodoB: { inicio: '2026-05-01', fim: '2026-05-31', label: '01/05/2026 – 31/05/2026', diasComDados: 15 },
      resumoA: { fluxoTotal: 1000, mediaPorHora: 50, horaPico: '10h', horaVale: '03h', ticketMedio: 15, receita: 15000, pagantes: 900 },
      resumoB: { fluxoTotal: 1200, mediaPorHora: 60, horaPico: '11h', horaVale: '02h', ticketMedio: 16, receita: 18000, pagantes: 1100 },
      delta: { fluxoTotalPct: 20, mediaPorHoraPct: 20, ticketMedioPct: 6.67, receitaPct: 20, pagantesPct: 22.22 },
      serieA: [{ chave: '2025-05-01', valor: 100, label: '2025-05-01' }],
      serieB: [{ chave: '2026-05-01', valor: 120, label: '2026-05-01' }],
      porHora: [{ faixaHoraria: '10h', valorA: 100, valorB: 120, deltaPct: 20 }],
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
      expect(screen.getByText('10h')).toBeInTheDocument();
    });
  });
});
