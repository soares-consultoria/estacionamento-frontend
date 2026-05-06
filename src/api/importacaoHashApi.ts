/**
 * Pré-checagem de duplicata via HEAD antes do upload real.
 *
 * HEAD /api/importacao/hash/{sha256}?instituicaoId=
 *   200 → duplicata (arquivo já processado com sucesso) — NÃO enviar
 *   204 → novo, pode fazer upload
 *   400 → hash inválido
 *   outros → erro de rede / servidor
 *
 * NOTA: não usamos 404 porque o CloudFront está configurado com
 * CustomErrorResponse 404→200+index.html (necessário para o React SPA).
 * O backend retorna 204 (No Content) para "não encontrado" — o CloudFront
 * não intercepta respostas 2xx.
 */
import api from '../lib/axios';

export type HashCheckResult = 'duplicate' | 'new' | 'error';

export async function checkHash(
  sha256: string,
  instituicaoId?: number | null,
): Promise<HashCheckResult> {
  try {
    const response = await api.head(`/api/importacao/hash/${sha256}`, {
      params: instituicaoId ? { instituicaoId } : undefined,
    });
    // 200 → duplicata | 204 → arquivo novo
    return response.status === 200 ? 'duplicate' : 'new';
  } catch {
    // Erros de rede, 401, 400, etc → não bloquear o usuário
    return 'error';
  }
}
