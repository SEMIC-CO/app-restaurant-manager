import { create } from 'zustand';
import type { AuthUser } from '@/types';

const SCOPE_KEY = 'app-session-scope';
const LEGACY_SESSION_KEY = 'app-auth-session';

/**
 * Alcance de la sesión en este navegador. NO contiene credenciales:
 * solo indica si la sesión debe sobrevivir a cerrar el navegador
 * ('persistent') o a cerrar la pestaña ('session').
 */
export type SessionScope = 'persistent' | 'session';

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export interface AuthState {
  /** Access token JWT (15 min). Vive solo en memoria: nunca se persiste. */
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  /** Sube en cada sesión establecida: permite descartar respuestas obsoletas. */
  version: number;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

function readScope(storage: Storage | undefined): SessionScope | null {
  try {
    const value = storage?.getItem(SCOPE_KEY);
    return value === 'persistent' || value === 'session' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Indica si el navegador guarda una sesión activa. La credencial real
 * vive en la cookie httpOnly `refresh_token` del backend.
 */
export function hasSessionScope(): boolean {
  if (typeof window === 'undefined') return false;
  return readScope(window.localStorage) !== null || readScope(window.sessionStorage) !== null;
}

export function readSessionScope(): SessionScope | null {
  if (typeof window === 'undefined') return null;
  return readScope(window.localStorage) ?? readScope(window.sessionStorage);
}

export function writeSessionScope(scope: SessionScope) {
  try {
    const target = scope === 'persistent' ? window.localStorage : window.sessionStorage;
    const other = scope === 'persistent' ? window.sessionStorage : window.localStorage;
    target.setItem(SCOPE_KEY, scope);
    other.removeItem(SCOPE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearSessionScope() {
  try {
    window.localStorage.removeItem(SCOPE_KEY);
    window.sessionStorage.removeItem(SCOPE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * La app está abierta como PWA instalada. En ese modo el navegador puede
 * descartar el sessionStorage al cerrar la ventana (algo que no pasa en una
 * pestaña normal), así que la sesión debe marcarse como persistente.
 */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Elimina la sesión guardada por versiones anteriores, que dejaban el
 * access token en localStorage (legible desde JS).
 */
export function purgeLegacySession() {
  try {
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Sesión del usuario: access token (JWT, 15 min) + datos del usuario.
 * El access token NO se persiste: se mantiene en memoria y se renueva
 * contra el backend con la cookie httpOnly `refresh_token`.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'checking',
  version: 0,

  setSession: (accessToken, user) =>
    set((state) => ({
      accessToken,
      user,
      status: 'authenticated',
      version: state.version + 1,
    })),

  clearSession: () =>
    set({ accessToken: null, user: null, status: 'anonymous' }),

  setStatus: (status) => set({ status }),
}));
