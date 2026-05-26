import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 4173,
    proxy: {
      '/java': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/java/, ''),
      },
      '/python': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/python/, ''),
      },
      '/api': {
        target: 'http://localhost:8181',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
