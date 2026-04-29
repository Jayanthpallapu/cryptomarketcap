import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [react()],
    build: {
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'react-chartjs-2']
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api/coingecko': {
          target: 'https://api.coingecko.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coingecko/, '/api/v3'),
          headers: {
            'Accept': 'application/json',
            'x-cg-demo-api-key': env.VITE_CG_API_KEY
          }
        }
      }
    }
  }
})
