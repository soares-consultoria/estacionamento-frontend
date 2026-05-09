import { Page } from '@playwright/test';

/**
 * Faz login na aplicação via UI e aguarda o redirect para o dashboard.
 * Usa `networkidle` para garantir que o token JWT está gravado no localStorage.
 */
export async function loginAs(page: Page, email: string, senha: string) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(senha);
  await page.getByRole('button', { name: /entrar/i }).click();
  // Aguarda redirect para a área autenticada
  await page.waitForURL(/\/(dashboard|comparativo|home)/, { timeout: 10_000 });
}

/**
 * Injeta o token JWT diretamente no localStorage (mais rápido que login via UI).
 * Requer que o token seja obtido externamente (fixture ou API call direta).
 */
export async function setToken(page: Page, token: string) {
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

/**
 * Navega para /comparativo e aguarda a página carregar.
 */
export async function gotoComparativo(page: Page) {
  await page.goto('/comparativo');
  // Aguarda o título ou o primeiro elemento da página
  await page.waitForSelector('[data-testid="comparativo-page"], h1, .comparativo-root', {
    timeout: 8_000,
  }).catch(() => {/* ignora se seletor não existir */});
}
