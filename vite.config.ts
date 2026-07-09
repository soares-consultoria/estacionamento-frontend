import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // App servido sob o path /terral (ex.: https://gestaonamao.ai/terral).
  // 'base' faz os assets (JS/CSS/img) serem referenciados a partir de /terral/.
  // Obs.: a API interna permanece em /estacionamento-api (não é visível na URL).
  base: '/terral/',
  // Garante que o React Router funcione com rotas client-side no Nginx
  build: {
    outDir: 'dist',
  },
})
