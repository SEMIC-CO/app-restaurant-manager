import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // <-- Permite probar la PWA e iconos en npm run dev
      },
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
      ],

      manifest: {
        name: 'RestoBar Manager',
        short_name: 'RestoBar Manager',
        description: 'Software de gestión para restaurantes y bares',
        theme_color: '#FF6600',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // `import.meta.dirname` reemplaza a `__dirname` (soportado por el
      // `configLoader: 'native'` que será el default en próximas versiones).
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
