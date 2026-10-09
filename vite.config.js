import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  root: 'frontend',
  base: command === 'build' ? '/Nguyen-Luong-Nhat-Phuong_24CT1_CNPM_LOKI/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
}))
