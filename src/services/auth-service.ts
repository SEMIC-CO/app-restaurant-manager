import { apiFetch, refreshSession } from './useFetch';
import type {
    ActivateAccountPayload,
    ApiResponse,
    LoginPayload,
    LoginResult,
    MessageResponse,
    RegisterPayload,
    RegisterResponse,
    ResendActivationPayload,
} from '@/types';

/**
 * Servicio de autenticación — espejo de los endpoints `auth/*` del backend
 * (AuthController: register, login, refresh, logout, activate, resendActivation).
 */
class AuthService {

    async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
        return apiFetch<ApiResponse<RegisterResponse>>('auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async login(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
        return apiFetch<ApiResponse<LoginResult>>('auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Verifica la sesión con el backend: la cookie httpOnly `refresh_token`
     * se valida y se renueva el access token. Si la cookie no es válida
     * responde 401. Delega en el refresh singleton de `apiFetch`.
     */
    async verifySession(): Promise<ApiResponse<LoginResult> | null> {
        return refreshSession();
    }

    async logout(): Promise<ApiResponse<MessageResponse>> {
        return apiFetch<ApiResponse<MessageResponse>>('auth/logout', {
            method: 'POST',
        });
    }

    async activate(payload: ActivateAccountPayload): Promise<ApiResponse<MessageResponse | null>> {
        return apiFetch<ApiResponse<MessageResponse | null>>('auth/activate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async resendActivation(payload: ResendActivationPayload): Promise<ApiResponse<MessageResponse>> {
        return apiFetch<ApiResponse<MessageResponse>>('auth/resend-activation', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

}

export const authService = new AuthService();
