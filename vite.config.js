import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['apexcharts', 'react-apexcharts']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/cmc-api': {
        target: 'https://pro-api.coinmarketcap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cmc-api/, ''),
        headers: {
          'X-CMC_PRO_API_KEY': '5dad362c6c1e4a9f82817866ce9d78f2',
          'Accept': 'application/json'
        }
      },
      '/news-api': {
        target: 'https://min-api.cryptocompare.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news-api/, ''),
        headers: { 'Accept': 'application/json' }
      }
    }
  }
})
