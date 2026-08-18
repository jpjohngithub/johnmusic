import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Escuta em todas as interfaces de rede (0.0.0.0 / IP Local / LAN)
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  }
})
