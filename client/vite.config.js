import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'
// Vite config — PostCSS handles Tailwind (no @tailwindcss/vite plugin)
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://job-mug.vercel.app/',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
});