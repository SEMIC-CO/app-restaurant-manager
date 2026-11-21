import { useEffect } from 'react';
import { authService } from '@/services';
import {
  isStandalonePwa,
  purgeLegacySession,
  readSessionScope,
  useAuthStore,
  writeSessionScope,
} from '@/store';

/**
 * Arranque de sesión: al cargar la app se pregunta al backend si la cookie
 * httpOnly `refresh_token` sigue siendo válida. El backend valida la cookie y
 * devuelve un access token nuevo; si no es válida, la sesión queda anónima y
 * los guards redirigen a /login.
 *
 * La comprobación se hace SIEMPRE, aunque no esté el marcador de ámbito: en
 * una PWA instalada el sessionStorage puede haberse perdido al cerrar la app,
 * pero la cookie (7 días) sigue siendo válida. El marcador es solo una pista
 * de UX, nunca la credencial.
 */
export function useSessionBootstrap() {
  useEffect(() => {
    purgeLegacySession();

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const resp = await authService.verifySession();
        if (cancelled) return;

        if (resp?.code === 200) {
          const standalone = isStandalonePwa();
          if (standalone || !readSessionScope()) {
            writeSessionScope(standalone ? 'persistent' : 'session');
          }
          useAuthStore
            .getState()
            .setSession(resp.data.accessToken, resp.data.user);
        } else {
          useAuthStore.getState().clearSession();
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().clearSession();
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);
}
