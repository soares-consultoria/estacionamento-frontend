import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatAiWidget from '../components/chatai/ChatAiWidget';
import ChatAiUsoBar from '../components/chatai/ChatAiUsoBar';
import { enviarMensagem, obterUso, type StreamCallbacks } from '../api/chatAi';

vi.mock('../api/chatAi', () => ({
  obterUso: vi.fn(),
  listarConversas: vi.fn().mockResolvedValue([]),
  obterConversa: vi.fn(),
  enviarMensagem: vi.fn(),
}));

const uso = {
  periodo: '2026-07', consumido: 0, cotaMensal: null, limiteAbsoluto: null,
  permiteExcedente: true, excedente: 0, percentual: 10,
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  vi.mocked(obterUso).mockResolvedValue(uso);
  vi.mocked(enviarMensagem).mockReset();
});

async function abrir() {
  render(<ChatAiWidget />);
  fireEvent.click(screen.getByLabelText(/Abrir o Assistente/i));
  await screen.findByText('Assistente GestãoNaMão.ai');
}

describe('ChatAiWidget', () => {
  it('mostra o launcher e abre o painel', async () => {
    await abrir();
    expect(screen.getByText(/Conectado aos seus indicadores/i)).toBeInTheDocument();
  });

  it('envia mensagem e exibe o stream do assistente', async () => {
    vi.mocked(enviarMensagem).mockImplementation(
      async (_id: string | null, _msg: string, cb: StreamCallbacks) => {
        cb.onDelta('Faturamento: ');
        cb.onDelta('R$ 1.000');
        cb.onDone({ conversaId: 'c1', tokensPrompt: 10, tokensCompletion: 5, percentualCota: 12 });
      },
    );
    await abrir();
    fireEvent.change(screen.getByLabelText(/Mensagem para o assistente/i), {
      target: { value: 'Qual o faturamento?' },
    });
    fireEvent.click(screen.getByLabelText(/Enviar mensagem/i));

    await waitFor(() => expect(screen.getByText(/Faturamento: R\$ 1\.000/)).toBeInTheDocument());
    expect(screen.getByText('Qual o faturamento?')).toBeInTheDocument();
  });

  it('exibe aviso amigável com CTA quando a cota é excedida', async () => {
    vi.mocked(enviarMensagem).mockImplementation(
      async (_id: string | null, _msg: string, cb: StreamCallbacks) => {
        cb.onErro('Cota mensal de tokens de IA atingida.', 'CHAT_AI_COTA_EXCEDIDA');
      },
    );
    await abrir();
    fireEvent.change(screen.getByLabelText(/Mensagem para o assistente/i), {
      target: { value: 'Oi' },
    });
    fireEvent.click(screen.getByLabelText(/Enviar mensagem/i));

    await waitFor(() =>
      expect(screen.getByText(/Fale com o administrador/i)).toBeInTheDocument(),
    );
  });
});

describe('ChatAiUsoBar', () => {
  it('fica âmbar em 80%+ e vermelho em 100%', () => {
    const { rerender } = render(<ChatAiUsoBar percentual={85} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-amber-500');
    rerender(<ChatAiUsoBar percentual={100} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-red-500');
  });
});
