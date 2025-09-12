import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 10000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Ensure origin header is properly set
            proxyReq.setHeader('origin', 'http://localhost:5173');
          });
        },
        headers: {
          'origin': 'http://localhost:5173'
        }
      },
    },
  },
  preview: {
    port: 4173,
  },
})
