/**
 * E2E — Ticket Médio no Dashboard (Visão Geral)
 *
 * Cobre a separação do ticket médio em dois cards distintos:
 *   - "Ticket Médio Rotativo"   (arrecadação / tickets pagos rotativos)
 *   - "Ticket Médio Mensalista" (valor mensalidades / contratos pagos)
 *
 * Contexto: antes havia um único card "Ticket Médio" com fórmula divergente
 * entre endpoints. Agora a fonte é única (TicketMedioCalculator) e a UI separa
 * as duas naturezas.
 *
 * Pré-requisito: backend rodando em http://localhost:8181/estacionamento-api
 * com o usuário admin. Se indisponível, o teste é skipped automaticamente.
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN = {
  email: process.env.E2E_USER_ADMIN ?? 'admin@sistema.local',
  senha: process.env.E2E_PASS_ADMIN ?? '1234567890',
};

const BACKEND_URL =
  process.env.E2E_BACKEND_URL ?? 'http://localhost:8181/estacionamento-api';

/** Busca a resposta completa de login (token + perfil) usada pelo AuthContext. */
async function getLoginPayload(email: string, senha: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Injeta a sessão no localStorage replicando exatamente o que o AuthContext grava:
 *  - 'token'  → usado pelo interceptor do axios
 *  - 'auth'   → objeto AuthUser lido no mount para decidir autenticação
 */
async function loginViaLocalStorage(page: Page, email: string, senha: string): Promise<boolean> {
  const data = await getLoginPayload(email, senha);
  if (!data || !data.token) return false;

  const authUser = {
    nome: data.nome,
    email: data.email,
    role: data.role,
    instituicaoId: data.instituicao_id,
    token: data.token,
    plano: data.plano ?? 'ESSENCIAL',
    funcionalidades: data.funcionalidades ?? [],
  };

  await page.addInitScript(
    ({ token, auth }) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('auth', JSON.stringify(auth));
    },
    { token: data.token, auth: authUser },
  );
  return true;
}

test.describe('Dashboard — Ticket Médio (Rotativo e Mensalista)', () => {
  test('exibe os dois cards de ticket médio separados', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, ADMIN.email, ADMIN.senha);
    test.skip(!loggedIn, 'Backend não disponível ou credenciais inválidas');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Os dois cards devem existir com títulos explícitos
    await expect(page.getByText('Ticket Médio Rotativo')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Ticket Médio Mensalista')).toBeVisible({ timeout: 8_000 });

    // Não deve mais existir um card genérico "Ticket Médio" sem qualificador
    const genericos = await page.getByText(/^Ticket Médio$/).count();
    expect(genericos).toBe(0);
  });

  test('card rotativo exibe valor monetário e mensalista exibe valor ou "—"', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, ADMIN.email, ADMIN.senha);
    test.skip(!loggedIn, 'Backend não disponível ou credenciais inválidas');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Raiz do KpiCard = div.rounded-xl que contém o título + o valor.
    const cardRotativo = page.locator('div.rounded-xl').filter({ hasText: 'Ticket Médio Rotativo' });
    await expect(cardRotativo).toBeVisible({ timeout: 8_000 });
    // Rotativo sempre é monetário (R$ 0,00 quando o mês não tem dados)
    await expect(cardRotativo).toContainText(/R\$/);

    // Mensalista mostra valor monetário OU "—" (quando não há contratos pagos no período)
    const cardMensalista = page.locator('div.rounded-xl').filter({ hasText: 'Ticket Médio Mensalista' });
    await expect(cardMensalista).toBeVisible({ timeout: 8_000 });
    await expect(cardMensalista).toContainText(/R\$|—/);
  });
});
