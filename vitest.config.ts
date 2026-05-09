import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Exclui specs do Playwright (e2e-tests/) — eles são rodados por `npm run test:e2e`
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e-tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
