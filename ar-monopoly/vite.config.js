import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:
  {
    allowedHosts: ['9435420eb4d7.ngrok-free.app']
  }
})
