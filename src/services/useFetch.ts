import { hasSessionScope, useAuthStore } from '@/store/auth-store';
import type { ApiResponse, LoginResult } from '@/types';

const BASE_URL = import.meta.env.VITE_URL_API ?? '';

function buildUrl(path: string) {
    return `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function request(path: string, options: RequestInit, token: string | null) {
    // Fastify rechaza un body vacío si el content-type es application/json:
    // el header solo se manda cuando la petición lleva body (p.ej. /auth/refresh).
    const hasBody = options.body !== undefined && options.body !== null;

    const response = await fetch(buildUrl(path), {
        ...options,
        headers: {
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options?.headers || {}),
        },
        credentials: 'include',
    });

    return response.json();
}

/**
 * Verifica la sesión contra el backend: la cookie httpOnly `refresh_token`
 * es la credencial real. Si es válida, el backend rota el access token.
 */
async function performRefresh(): Promise<ApiResponse<LoginResult> | null> {
    const versionAtStart = useAuthStore.getState().version;

    try {
        const data = await request('auth/refresh', { method: 'POST' }, null);
        if (data?.code === 200 && data?.data?.accessToken) {
            useAuthStore.getState().setSession(data.data.accessToken, data.data.user);
            return data as ApiResponse<LoginResult>;
        }
    } catch {
        /* ignore */
    }

    // Solo se limpia la sesión si no se estableció otra mientras tanto
    // (evita que una respuesta obsoleta cierre una sesión recién iniciada).
    if (useAuthStore.getState().version === versionAtStart) {
        useAuthStore.getState().clearSession();
    }

    return null;
}

let pendingRefresh: Promise<ApiResponse<LoginResult> | null> | null = null;

/**
 * Refresh de sesión en singleton: nunca hay dos renovaciones simultáneas
 * (pestañas paralelas, reintentos o el doble montaje de React en dev).
 */
export function refreshSession(): Promise<ApiResponse<LoginResult> | null> {
    if (!pendingRefresh) {
        pendingRefresh = performRefresh().finally(() => {
            pendingRefresh = null;
        });
    }

    return pendingRefresh;
}

export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = useAuthStore.getState().accessToken;
    try {
        let data = await request(path, options ?? {}, token);
        const isAuthEndpoint = path.startsWith('auth/');

        if (data?.code === 401 && !isAuthEndpoint && (token || hasSessionScope())) {
            const refreshed = await refreshSession();
            if (refreshed?.data?.accessToken) {
                data = await request(path, options ?? {}, refreshed.data.accessToken);
            }
        }

        return data as T;
    } catch (error) {
        console.log('Fetch error:', error);
        throw error;
    }
}
