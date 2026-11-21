import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs'
import path from 'path'

// Identifica este build. Se graba en el bundle y en dist/version.json: si el
// serving sigue entregando la versión anterior, main.tsx lo detecta y fuerza
// una recarga limpia (sin importar lo que haya cacheado el service worker).
const APP_VERSION = `${Date.now().toString(36)}-${process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'}`

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    VitePWA({
      // Autorecarga cuando el SW detecta un build nuevo. La comprobación extra
      // de version.json cubre el caso de que el servidor cachee sw.js.
      registerType: 'autoUpdate',
      devOptions: {
        // En dev el SW precachea index.html y sirve la versión vieja aunque
        // HMR ya haya cambiado los archivos. La PWA se prueba con build+preview.
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Sin fallback de navegación: el SW NUNCA sirve index.html desde el
        // precache. Así cada recarga va al servidor y trae el bundle nuevo.
        navigateFallback: null,
        // precacheAndRoute intercepta cualquier URL precacheada, incluido
        // index.html. Hay que excluirlo del precache (globIgnores) para que la
        // recarga siempre vaya al servidor. version.json tampoco se precachea.
        globIgnores: ['**/index.html', 'version.json'],
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
    {
      name: 'app-version-file',
      apply: 'build',
      closeBundle() {
        const outDir = path.resolve(import.meta.dirname, 'dist')
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(
          path.join(outDir, 'version.json'),
          JSON.stringify({ version: APP_VERSION }),
        )
      },
    },
  ],
  resolve: {
    alias: {
      // `import.meta.dirname` reemplaza a `__dirname` (soportado por el
      // `configLoader: 'native'` que será el default en próximas versiones).
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
