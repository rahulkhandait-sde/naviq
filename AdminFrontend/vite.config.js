import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/naviq/', 
  server: {
    proxy: {
      "/rurl": {
        target: "http://localhost:5000", // your backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
