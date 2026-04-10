import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante que o React Router funcione com rotas client-side no Nginx
  build: {
    outDir: 'dist',
  },
})
