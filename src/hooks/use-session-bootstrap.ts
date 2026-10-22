import { useEffect } from 'react';
import { authService } from '@/services';
import { purgeLegacySession, readSessionScope, useAuthStore } from '@/store';

/**
 * Arranque de sesión: al cargar la app se pregunta al backend si la
 * cookie httpOnly `refresh_token` sigue siendo válida. El backend valida
 * la cookie y devuelve un access token nuevo; si no es válida, la sesión
 * queda como anónima y los guards redirigen a /login.
 *
 * El marcador de alcance (localStorage si "recordarme", sessionStorage si
 * no) no guarda credenciales: solo indica si esta sesión debe sobrevivir
 * al cierre del navegador o de la pestaña.
 */
export function useSessionBootstrap() {
  useEffect(() => {
    purgeLegacySession();

    if (!readSessionScope()) {
      useAuthStore.getState().setStatus('anonymous');
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const resp = await authService.verifySession();
        if (cancelled) return;

        if (resp?.code === 200) {
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

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);
}
