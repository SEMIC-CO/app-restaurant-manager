import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
    ApiResponse,
    ApiUser,
    CreateUserPayload,
    ListUsersParams,
    Paginated,
    UpdateUserPayload,
} from '@/types';

/**
 * Servicio de usuarios — espejo de UsersController. Alcance **empresa** del
 * JWT (`GET /users` trae los usuarios de todas las sedes de la empresa).
 *
 * Notas del backend:
 * - `DELETE` responde `403` si es tu propio usuario o el del propietario.
 * - `profileId`/`headquarterId` se validan contra la empresa (`400` si no
 *   corresponden) y el correo no puede repetirse (`409`).
 * - `PUT /:id/password` cambia la contraseña (mínimo 8).
 */
class UserService {

    async list(
        params: ListUsersParams = {},
    ): Promise<ApiResponse<Paginated<ApiUser>>> {
        return apiFetch<ApiResponse<Paginated<ApiUser>>>(
            `users${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                search: params.search,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiUser>> {
        return apiFetch<ApiResponse<ApiUser>>(`users/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateUserPayload): Promise<ApiResponse<ApiUser>> {
        return apiFetch<ApiResponse<ApiUser>>('users', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(
        id: number,
        payload: UpdateUserPayload,
    ): Promise<ApiResponse<ApiUser>> {
        return apiFetch<ApiResponse<ApiUser>>(`users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async updatePassword(
        id: number,
        password: string,
    ): Promise<ApiResponse<unknown>> {
        return apiFetch<ApiResponse<unknown>>(`users/${id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password }),
        });
    }

    /** Borra el usuario (`403` si es el propio o el del propietario). */
    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`users/${id}`, {
            method: 'DELETE',
        });
    }

}

export const userService = new UserService();
