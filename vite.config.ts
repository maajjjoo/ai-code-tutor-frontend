import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const apiUrl = process.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error('VITE_API_URL must be set for production build');
    }
  }
  return {
    plugins: [react(), tailwindcss()],
  };
})
