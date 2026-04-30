import { describe, it, expect, vi, beforeAll } from 'vitest';
import { sha256File } from '../lib/sha256';

// jsdom não implementa crypto.subtle; precisamos de um mock
beforeAll(() => {
  // Mock WebCrypto: digest retorna ArrayBuffer de 32 bytes preenchido com o valor do byte 0xAB
  vi.stubGlobal('crypto', {
    subtle: {
      digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(0xab).buffer),
    },
  });
});

describe('sha256File', () => {
  it('retorna string hex de 64 caracteres', async () => {
    const file = new File(['hello world'], 'test.pdf', { type: 'application/pdf' });
    const hash = await sha256File(file);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('retorna hash consistente para o mesmo conteúdo', async () => {
    const file = new File(['same content'], 'same.pdf', { type: 'application/pdf' });
    const hash1 = await sha256File(file);
    const hash2 = await sha256File(file);
    expect(hash1).toBe(hash2);
  });

  it('funciona com arquivo vazio', async () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    const hash = await sha256File(file);
    expect(hash).toHaveLength(64);
  });

  it('funciona com arquivo "grande" (mock de chunk)', async () => {
    // Simula arquivo de 3 MB (> 2 MB threshold → usa leitura por chunks)
    const bigContent = new Uint8Array(3 * 1024 * 1024).fill(0x42);
    const file = new File([bigContent], 'big.pdf', { type: 'application/pdf' });
    const hash = await sha256File(file);
    expect(hash).toHaveLength(64);
  });
});
