/**
 * Fuerza una recarga limpia de la aplicación: da de baja el service worker,
 * borra las cachés y recarga con un parámetro que evita la caché HTTP del HTML.
 * Se usa tanto en la comprobación automática de versión como en el botón
 * "Actualizar aplicación" del header.
 */
export async function forceAppUpdate(tag: string = Date.now().toString()): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  window.location.replace(`/?v=${encodeURIComponent(tag)}`);
}
