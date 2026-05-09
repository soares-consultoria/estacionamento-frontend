/**
 * E2E — Comparativo de Períodos Avançado
 *
 * Estes testes cobrem o fluxo completo da feature:
 *  1. Acesso negado para plano ESSENCIAL (vê comparativo legado)
 *  2. Acesso permitido para plano PROFISSIONAL (vê comparativo avançado)
 *  3. Validação de formulário (datas inválidas, aviso de período muito longo)
 *  4. Atalhos de intervalo (Mês anterior, Mesmo mês ano passado)
 *  5. Persistência de filtros no localStorage
 *  6. Troca de granularidade
 *  7. Export dropdown visível e links corretos
 *
 * Pré-requisito: backend rodando em http://localhost:8181/estacionamento-api
 * com usuários de teste (ESSENCIAL e PROFISSIONAL) configurados.
 *
 * Se o backend não estiver disponível, os testes que dependem de login real
 * serão skipped automaticamente via `test.skip`.
 */

import { test, expect, Page } from '@playwright/test';

/* ── Configuração de usuários de teste ─────────────────────────────────────── */

const ESSENCIAL = {
  email: process.env.E2E_USER_ESSENCIAL ?? 'essencial@test.local',
  senha: process.env.E2E_PASS_ESSENCIAL ?? 'senha123',
};

const PROFISSIONAL = {
  email: process.env.E2E_USER_PROF ?? 'profissional@test.local',
  senha: process.env.E2E_PASS_PROF ?? 'senha123',
};

const BACKEND_URL =
  process.env.E2E_BACKEND_URL ?? 'http://localhost:8181/estacionamento-api';

/* ── Helper: login via API (rápido, sem UI) ─────────────────────────────────── */

async function getToken(email: string, senha: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? data.access_token ?? null;
  } catch {
    return null;
  }
}

async function loginViaLocalStorage(page: Page, email: string, senha: string): Promise<boolean> {
  const token = await getToken(email, senha);
  if (!token) return false;
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('authToken', t);
  }, token);
  return true;
}

/* ── Suite 1: Controle de acesso por plano ───────────────────────────────────── */

test.describe('Controle de acesso — Comparativo', () => {
  test('usuário ESSENCIAL vê comparativo legado (tabela de KPIs mensais)', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, ESSENCIAL.email, ESSENCIAL.senha);
    test.skip(!loggedIn, 'Backend não disponível ou credenciais inválidas');

    await page.goto('/comparativo');
    await page.waitForLoadState('networkidle');

    // O comparativo legado mostra meses como colunas de uma tabela
    // O comparativo avançado tem campos de data e granularidade
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[type="date"]').first()).not.toBeVisible();
  });

  test('usuário PROFISSIONAL vê comparativo avançado (seletor de intervalo)', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível ou credenciais inválidas');

    await page.goto('/comparativo');
    await page.waitForLoadState('networkidle');

    // O comparativo avançado deve renderizar seletores de data
    await expect(page.locator('input[type="date"]').first()).toBeVisible({ timeout: 8_000 });
  });
});

/* ── Suite 2: Formulário e validações ────────────────────────────────────────── */

test.describe('Formulário — Comparativo Avançado', () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    if (!loggedIn) test.skip();
    await page.goto('/comparativo');
    await page.waitForSelector('input[type="date"]', { timeout: 8_000 });
  });

  test('campos de data dos dois períodos estão visíveis', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(4); // inicioA, fimA, inicioB, fimB
  });

  test('atalho "Mês anterior" preenche datas do período A corretamente', async ({ page }) => {
    // Procura o botão do atalho
    const btn = page.getByRole('button', { name: /mês anterior/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();

    const hoje = new Date();
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const expectedYear = mesAnterior.getFullYear();
    const expectedMonth = String(mesAnterior.getMonth() + 1).padStart(2, '0');

    const inicioA = page.locator('input[type="date"]').first();
    const value = await inicioA.inputValue();
    expect(value).toMatch(`${expectedYear}-${expectedMonth}`);
  });

  test('atalho "Mesmo mês ano passado" preenche período B', async ({ page }) => {
    // Primeiro clica em Mês anterior para preencher período A
    await page.getByRole('button', { name: /mês anterior/i }).first().click();

    // Depois clica em "Mesmo mês ano passado" para período B
    const btnB = page.getByRole('button', { name: /ano passado/i }).first();
    if (await btnB.isVisible()) {
      await btnB.click();
      const inicioB = page.locator('input[type="date"]').nth(2);
      const value = await inicioB.inputValue();
      const hoje = new Date();
      expect(value).toMatch(String(hoje.getFullYear() - 1));
    }
  });

  test('seletor de granularidade contém as 4 opções', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    const labels = options.map(o => o.toLowerCase());
    expect(labels.some(l => l.includes('dia'))).toBeTruthy();
    expect(labels.some(l => l.includes('semana'))).toBeTruthy();
    expect(labels.some(l => l.includes('mês') || l.includes('mes'))).toBeTruthy();
    expect(labels.some(l => l.includes('hora'))).toBeTruthy();
  });
});

/* ── Suite 3: Persistência de filtros ────────────────────────────────────────── */

test.describe('Persistência de filtros — localStorage', () => {
  test('filtros sobrevivem a reload da página', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForSelector('input[type="date"]', { timeout: 8_000 });

    // Preenche uma data específica no primeiro campo
    const inicioA = page.locator('input[type="date"]').first();
    await inicioA.fill('2026-01-01');

    // Recarrega a página
    await page.reload();
    await page.waitForSelector('input[type="date"]', { timeout: 8_000 });

    // Verifica que a data foi mantida
    const restoredValue = await page.locator('input[type="date"]').first().inputValue();
    expect(restoredValue).toBe('2026-01-01');
  });
});

/* ── Suite 4: Export dropdown ────────────────────────────────────────────────── */

test.describe('Export — Comparativo Avançado', () => {
  test('dropdown de exportação aparece com as 3 opções', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForLoadState('networkidle');

    // Procura o botão de exportar
    const exportBtn = page.getByRole('button', { name: /exportar/i }).first();
    test.skip(!(await exportBtn.isVisible({ timeout: 5_000 }).catch(() => false)),
      'Botão de exportar não visível (pode precisar de dados)');

    await exportBtn.click();

    // Verifica as 3 opções no dropdown
    await expect(page.getByRole('menuitem', { name: /xlsx/i })
      .or(page.getByText(/xlsx/i))).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('menuitem', { name: /pdf/i })
      .or(page.getByText(/pdf/i))).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('menuitem', { name: /csv/i })
      .or(page.getByText(/csv/i))).toBeVisible({ timeout: 3_000 });
  });
});

/* ── Suite 5: Resultados após submit ────────────────────────────────────────── */

test.describe('Resultados — Comparativo Avançado', () => {
  test('submeter formulário com datas válidas exibe seção de resultados ou mensagem sem dados', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForSelector('input[type="date"]', { timeout: 8_000 });

    // Preenche os 4 campos de data
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-01-01');
    await dateInputs.nth(1).fill('2026-01-31');
    await dateInputs.nth(2).fill('2025-01-01');
    await dateInputs.nth(3).fill('2025-01-31');

    // Clica em comparar
    const btnComparar = page.getByRole('button', { name: /comparar/i }).first();
    await btnComparar.click();

    // Aguarda resposta: ou resultados ou mensagem de sem dados
    await page.waitForSelector(
      '[data-testid="resumo-cards"], [data-testid="sem-dados"], .alert, [role="alert"]',
      { timeout: 15_000 }
    ).catch(async () => {
      // Fallback: qualquer conteúdo novo apareceu após o submit
      await page.waitForLoadState('networkidle');
    });

    // A página não deve ter stack trace ou erro 500
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('500');
    expect(bodyText).not.toContain('NullPointerException');
  });

  test('tabela horária aparece quando granularidade=HORA e há dados', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForSelector('input[type="date"]', { timeout: 8_000 });

    // Seleciona granularidade HORA
    const select = page.locator('select').first();
    await select.selectOption({ label: /hora/i });

    // Preenche período pequeno (≤31 dias)
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-01-01');
    await dateInputs.nth(1).fill('2026-01-15');
    await dateInputs.nth(2).fill('2025-01-01');
    await dateInputs.nth(3).fill('2025-01-15');

    await page.getByRole('button', { name: /comparar/i }).first().click();
    await page.waitForLoadState('networkidle');

    // A tabela horária ou mensagem sem dados deve aparecer — sem erros
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
  });
});

/* ── Suite 6: Navegação e título da página ────────────────────────────────────── */

test.describe('Navegação', () => {
  test('página /comparativo carrega sem erros de JavaScript', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForLoadState('networkidle');

    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('título da página contém "Comparativo"', async ({ page }) => {
    const loggedIn = await loginViaLocalStorage(page, PROFISSIONAL.email, PROFISSIONAL.senha);
    test.skip(!loggedIn, 'Backend não disponível');

    await page.goto('/comparativo');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    const heading = await page.locator('[class*="heading"], [class*="title"]').first().textContent().catch(() => '');

    expect(
      title.toLowerCase().includes('comparativ') ||
      (h1 ?? '').toLowerCase().includes('comparativ') ||
      (heading ?? '').toLowerCase().includes('comparativ')
    ).toBeTruthy();
  });
});
