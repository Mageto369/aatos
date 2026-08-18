import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Fail build if required env vars are missing in CI
if (process.env.CI) {
  const required = ['VITE_API_URL']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
