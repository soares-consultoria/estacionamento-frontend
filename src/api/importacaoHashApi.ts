/**
 * Pré-checagem de duplicata via HEAD antes do upload real.
 *
 * HEAD /api/importacao/hash/{sha256}?instituicaoId=
 *   200 → duplicata (arquivo já processado com sucesso) — NÃO enviar
 *   404 → novo, pode fazer upload
 *   400 → hash inválido
 *   outros → erro de rede / servidor
 */
import api from '../lib/axios';

export type HashCheckResult = 'duplicate' | 'new' | 'error';

export async function checkHash(
  sha256: string,
  instituicaoId?: number | null,
): Promise<HashCheckResult> {
  try {
    await api.head(`/api/importacao/hash/${sha256}`, {
      params: instituicaoId ? { instituicaoId } : undefined,
    });
    // 200 OK → duplicata
    return 'duplicate';
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      if (err.response?.status === 404) return 'new';
      // 400 ou outros → tratar como erro para não bloquear o usuário silenciosamente
    }
    return 'error';
  }
}

function isAxiosError(err: unknown): err is { response?: { status: number } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}
