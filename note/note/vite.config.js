import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true ,
    allowedHosts: [
      '5b4e62ca-9ff4-45e8-a3c5-b1c97e3ac027-00-2nolp4ohalwuf.sisko.replit.dev'
      ]
  }
})
