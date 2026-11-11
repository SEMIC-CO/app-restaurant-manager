import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // `import.meta.dirname` reemplaza a `__dirname` (soportado por el
      // `configLoader: 'native'` que será el default en próximas versiones).
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
