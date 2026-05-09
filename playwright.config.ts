import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config para testes E2E do frontend.
 * Assume que o frontend está rodando em http://localhost:5173 (vite dev)
 * e o backend em http://localhost:8181/estacionamento-api.
 *
 * Para rodar localmente:
 *   npm run dev &                  # inicia o frontend
 *   npx playwright test            # roda os specs
 *
 * Em CI:
 *   webServer.command inicia o frontend automaticamente.
 */
export default defineConfig({
  testDir: './e2e-tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Inicia o servidor de desenvolvimento antes dos testes quando não estiver rodando */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
