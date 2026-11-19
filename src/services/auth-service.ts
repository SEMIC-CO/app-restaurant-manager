import { apiFetch, refreshSession } from './useFetch';
import type {
    ActivateAccountPayload,
    ApiResponse,
    AuthProfile,
    ChangePasswordPayload,
    LoginPayload,
    LoginResult,
    MessageResponse,
    RegisterPayload,
    RegisterResponse,
    ResendActivationPayload,
    UpdateProfilePayload,
} from '@/types';

/**
 * Servicio de autenticación — espejo de los endpoints `auth/*` del backend
 * (AuthController: register, login, refresh, logout, activate, resendActivation
 * + UserProfileController: profile, password).
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

    /**
     * Datos del propio perfil con perfil/empresa/sede resueltos.
     * No depende del módulo Usuarios: cualquier perfil puede leerlo.
     */
    async getProfile(): Promise<ApiResponse<AuthProfile>> {
        return apiFetch<ApiResponse<AuthProfile>>('auth/profile', {
            method: 'GET',
        });
    }

    /** Editar nombre, correo y teléfono del propio perfil. */
    async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<AuthProfile>> {
        return apiFetch<ApiResponse<AuthProfile>>('auth/profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Cambiar la contraseña propia: pide la actual (`401` si no coincide)
     * y la nueva debe tener mínimo 8 caracteres.
     */
    async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<MessageResponse>> {
        return apiFetch<ApiResponse<MessageResponse>>('auth/password', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

}

export const authService = new AuthService();
