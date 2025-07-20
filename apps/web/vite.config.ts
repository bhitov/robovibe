import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5614,
    host: '0.0.0.0', // Listen on all interfaces
    allowedHosts: ['robovibe.raspyaspie.com', 'localhost', '52.90.23.181'],
  },
  // Vite will automatically load .env files and expose VITE_* variables
})
