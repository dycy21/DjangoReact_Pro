import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This ensures the dev server runs on port 5173
    // as mentioned in your INSTALL.md and backend CORS settings
    port: 5173, 
    strictPort: true,
  }
})
