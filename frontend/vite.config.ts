import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Backend context-path=/api and controllers use /api/... prefix
        // so actual URLs are: http://localhost:8080/api/api/auth/...
        // Proxy passes /api/* as-is → http://localhost:8080/api/*
      },
    },
  },
})