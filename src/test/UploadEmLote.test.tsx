import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadEmLote from '../components/upload/UploadEmLote';

/* ─── Mocks globais ─── */

beforeAll(() => {
  // Mock WebCrypto
  vi.stubGlobal('crypto', {
    subtle: {
      digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(0x11).buffer),
    },
  });
});

// Mock dos módulos de API para isolar o componente
vi.mock('../api/importacaoHashApi', () => ({
  checkHash: vi.fn().mockResolvedValue('new'),
}));

vi.mock('../api/client', () => ({
  importacaoApi: {
    criarJob: vi.fn().mockResolvedValue({ jobId: 42, status: 'PENDENTE' }),
    consultarJob: vi.fn().mockResolvedValue({ id: 42, status: 'CONCLUIDO', mensagem: null, nomeArquivo: 'test.pdf', instituicaoId: 1 }),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

/* ─── Helpers ─── */

function makePdf(name = 'relatorio.pdf', size = 1024) {
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' });
}

/* ─── Testes ─── */

describe('UploadEmLote', () => {
  it('renderiza zona de drop e botões de seleção', () => {
    render(<UploadEmLote />);
    expect(screen.getByText(/Adicionar arquivos/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecionar pasta/i)).toBeInTheDocument();
  });

  it('adiciona arquivo PDF via drop e exibe na lista', async () => {
    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;

    const file = makePdf('RFE_jan.pdf');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('RFE_jan.pdf')).toBeInTheDocument();
    });
    // Deve identificar o tipo via heurística (label exato)
    expect(screen.getByText(/RFE — Financeiro/i)).toBeInTheDocument();
  });

  it('não adiciona arquivos não-PDF', async () => {
    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;

    const txt = new File(['text'], 'relatorio.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [txt] },
    });

    await waitFor(() => {
      expect(screen.queryByText('relatorio.txt')).not.toBeInTheDocument();
    });
  });

  it('não adiciona o mesmo arquivo duas vezes (dedup por nome+tamanho)', async () => {
    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;

    const file = makePdf('dup.pdf');
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      const items = screen.getAllByText('dup.pdf');
      expect(items).toHaveLength(1);
    });
  });

  it('exibe badge "Já enviado" quando checkHash retorna duplicate', async () => {
    const { checkHash } = await import('../api/importacaoHashApi');
    vi.mocked(checkHash).mockResolvedValueOnce('duplicate');

    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;
    fireEvent.drop(dropZone, { dataTransfer: { files: [makePdf('dup2.pdf')] } });

    // Aguarda o arquivo aparecer e clica em Enviar
    await waitFor(() => screen.getByText('dup2.pdf'));
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Já enviado/i)).toBeInTheDocument();
    });
  });

  it('exibe badge "Processado" após upload bem-sucedido', async () => {
    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;
    fireEvent.drop(dropZone, { dataTransfer: { files: [makePdf('ok.pdf')] } });

    await waitFor(() => screen.getByText('ok.pdf'));
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(
      () => expect(screen.getByText(/Processado/i)).toBeInTheDocument(),
      { timeout: 8000 },
    );
  });

  it('botão Enviar fica desabilitado quando não há arquivos pendentes', () => {
    render(<UploadEmLote />);
    // Sem arquivos, o botão não deve aparecer
    expect(screen.queryByRole('button', { name: /Enviar/i })).not.toBeInTheDocument();
  });

  it('limpa a lista ao clicar em Limpar lista', async () => {
    render(<UploadEmLote />);
    const dropZone = screen.getByText(/Arraste PDFs/i).parentElement!;
    fireEvent.drop(dropZone, { dataTransfer: { files: [makePdf('toClean.pdf')] } });

    await waitFor(() => screen.getByText('toClean.pdf'));
    fireEvent.click(screen.getByText(/Limpar lista/i));

    await waitFor(() => {
      expect(screen.queryByText('toClean.pdf')).not.toBeInTheDocument();
    });
  });
});
