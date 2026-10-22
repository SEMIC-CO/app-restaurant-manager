import { apiFetch, refreshSession } from "../useFetch";
import type {
    ApiResponse,
    LoginPayload,
    LoginResult,
    MessageResponse,
} from "@/types";

class Auth {

    async login(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
        return apiFetch<ApiResponse<LoginResult>>('auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async refresh(): Promise<ApiResponse<LoginResult>> {
        return apiFetch<ApiResponse<LoginResult>>('auth/refresh', {
            method: 'POST',
        });
    }

    /**
     * Verifica la sesión con el backend: la cookie httpOnly `refresh_token`
     * se valida y se renueva el access token. Si la cookie no es válida
     * responde 401.
     */
    async verifySession(): Promise<ApiResponse<LoginResult> | null> {
        return refreshSession();
    }

    async logout(): Promise<ApiResponse<MessageResponse>> {
        return apiFetch<ApiResponse<MessageResponse>>('auth/logout', {
            method: 'POST',
        });
    }

}

export const authService = new Auth();
