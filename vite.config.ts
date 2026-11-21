import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Con 'autoUpdate' la recarga es automática y el badge "Actualizar"
      // nunca aparece: encima, puede recargar a un cajero a mitad de venta.
      // En 'prompt' el SW queda en waiting y el badge ofrece actualizar.
      registerType: 'prompt',
      devOptions: {
        // En dev el SW precachea index.html y sirve la versión vieja aunque
        // HMR ya haya cambiado los archivos. La PWA se prueba con build+preview.
        enabled: false,
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
