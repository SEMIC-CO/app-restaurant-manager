import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigationStore } from '@/store/navigation-store';

/**
 * Carga el sidebar del perfil cuando hay sesión y lo vacía al cerrarla.
 *
 * Se monta en `App` junto a `useSessionBootstrap()`: cubre el login, el
 * refresh de arranque (recarga de la pestaña) y el logout sin que cada página
 * tenga que pedir los módulos.
 */
export function useNavigationBootstrap() {
  const status = useAuthStore((state) => state.status);
  const profileId = useAuthStore((state) => state.user?.profileId ?? null);

  useEffect(() => {
    if (status !== 'authenticated' || profileId === null) {
      useNavigationStore.getState().reset();
      return;
    }

    void useNavigationStore.getState().load();
  }, [status, profileId]);
}
