import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // App servido sob o path /estacionamento (ex.: https://gestaonamao.ai/estacionamento).
  // 'base' faz os assets (JS/CSS/img) serem referenciados a partir de /estacionamento/.
  base: '/estacionamento/',
  // Garante que o React Router funcione com rotas client-side no Nginx
  build: {
    outDir: 'dist',
  },
})
