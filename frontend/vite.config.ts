import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': { target: 'http://api:8080', changeOrigin: true },
      '/projects': { target: 'http://api:8080', changeOrigin: true },
      '/tasks': { target: 'http://api:8080', changeOrigin: true },
    }
  }
})
