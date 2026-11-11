import { create } from 'zustand';
import { menuService } from '@/services';
import type { ApiNavigationMenu } from '@/types';

export type NavigationStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NavigationState {
  status: NavigationStatus;
  /** `true` si el perfil es ADMINISTRADOR: el backend devuelve todo. */
  isAdmin: boolean;
  menus: ApiNavigationMenu[];
  /** Pide el sidebar del perfil al backend (`GET /menus/mine`). */
  load: () => Promise<void>;
  /** Vacía la navegación (logout o cambio de sesión). */
  reset: () => void;
}

/**
 * Renovación en curso: el sidebar lo piden el bootstrap de sesión y el layout
 * móvil a la vez, así que se comparte la misma petición.
 */
let inFlight: Promise<void> | null = null;

/**
 * Módulos que el perfil del JWT puede ver. Se pide **al iniciar sesión** y es
 * la única fuente del sidebar: lo que no esté aquí no se pinta (el backend
 * sigue siendo la autoridad final de cada endpoint).
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  status: 'idle',
  isAdmin: false,
  menus: [],

  load: () => {
    if (inFlight) return inFlight;

    set({ status: 'loading' });

    inFlight = (async () => {
      try {
        const resp = await menuService.getMine();
        if (resp.code === 200) {
          set({
            status: 'ready',
            isAdmin: resp.data.isAdmin,
            menus: resp.data.menus,
          });
        } else {
          set({ status: 'error' });
        }
      } catch {
        set({ status: 'error' });
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  reset: () => set({ status: 'idle', isAdmin: false, menus: [] }),
}));

/**
 * Destino inicial del usuario: el primer módulo que su perfil puede ver
 * (p. ej. Mesas para MESERO, Cocina para JEFE DE COCINA). Si no tiene
 * módulos, se queda el dashboard (`/`).
 */
export function firstMenuPath(menus: ApiNavigationMenu[]): string {
  return menus[0]?.path ?? '/';
}
