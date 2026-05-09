import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntervaloSelector from '../components/comparativo/IntervaloSelector';

describe('IntervaloSelector', () => {
  it('atalho Mês anterior preenche datas corretas em maio/2026', () => {
    // Mock date para maio de 2026
    vi.setSystemTime(new Date('2026-05-15'));
    const onInicio = vi.fn();
    const onFim = vi.fn();
    render(
      <IntervaloSelector
        label="Período A"
        inicio="2026-05-01"
        fim="2026-05-31"
        onChangeInicio={onInicio}
        onChangeFim={onFim}
      />
    );
    const botaoMesAnt = screen.getByText('Mês anterior');
    fireEvent.click(botaoMesAnt);
    expect(onInicio).toHaveBeenCalledWith('2026-04-01');
    expect(onFim).toHaveBeenCalledWith('2026-04-30');
    vi.useRealTimers();
  });
});
