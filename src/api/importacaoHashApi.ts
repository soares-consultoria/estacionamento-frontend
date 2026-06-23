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

/** Detalhes do registro existente com o mesmo conteúdo (hash). */
export interface DuplicadoInfo {
  existe: boolean;
  id: number | null;
  nome_arquivo: string | null;
  data_referencia: string | null;
  tipo_relatorio: string | null;
  status_processamento: string | null;
}

/**
 * Busca ONDE um conteúdo já está gravado (quando o upload é bloqueado como
 * duplicado). Retorna null em erro — é informativo e não deve quebrar o fluxo.
 */
export async function infoHash(
  sha256: string,
  instituicaoId?: number | null,
): Promise<DuplicadoInfo | null> {
  try {
    const r = await api.get<DuplicadoInfo>(`/api/importacao/hash/${sha256}`, {
      params: instituicaoId ? { instituicaoId } : undefined,
    });
    return r.data;
  } catch {
    return null;
  }
}
