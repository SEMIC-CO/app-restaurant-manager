import { useCallback, useSyncExternalStore } from 'react';

/**
 * Estado de una media query de CSS, con valor inicial síncrono (sin flash)
 * y suscripción a cambios al redimensionar la ventana.
 *
 * Se usa para saber si el panel lateral fijo de `POSLayout` está visible:
 * ese layout lo oculta con `hidden lg:block`, es decir, en pantallas
 * menores a 1024px el contenido pasa a un drawer.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', onStoreChange);
      return () =>
        mediaQueryList.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  // Server snapshot: en SSR nunca hay ventana (la app es SPA, por eso false)
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
