import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Aplica el tema al documento agregando/quitando la clase `dark`
 * en el elemento <html> (estrategia class de Tailwind).
 * También persiste el valor en localStorage.
 */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/**
 * Lee el tema guardado en localStorage o detecta preferencia del SO.
 * Por defecto 'light' si no hay nada.
 */
export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme: Theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));

// Sincronía inicial: asegura que la clase .dark del <html> coincide con el
// estado inicial del store (redundante con el script anti-FOUC, pero
// previene desincronías si localStorage cambió entre carga y mount).
applyTheme(useThemeStore.getState().theme);
