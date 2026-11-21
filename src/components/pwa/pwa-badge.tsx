import { useEffect } from 'react'
import { Workbox } from 'workbox-window'

declare const __APP_VERSION__: string

/**
 * Registro del service worker. No muestra ningún aviso: el SW se registra con
 * `/sw.js?v=<build>` porque Cloudflare cachea por URL completa (con `/sw.js`
 * a secas se quedaba 4 horas con una versión anterior) y recarga la página
 * automáticamente cuando se activa una versión nueva.
 */
export function PWABadge() {
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    const wb = new Workbox(`/sw.js?v=${__APP_VERSION__}`, { scope: '/' })
    wb.addEventListener('activated', (event) => {
      if (event.isUpdate || event.isExternal) window.location.reload()
    })
    void wb.register().catch((error: unknown) => {
      console.error('Error al registrar Service Worker:', error)
    })
  }, [])

  return null
}
