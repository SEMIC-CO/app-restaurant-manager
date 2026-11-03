import { apiFetch } from './useFetch';
import type {
    ApiResponse,
    ApiProfile,
    CreateProfilePayload,
    UpdateProfilePayload,
} from '@/types';

/**
 * Servicio de perfiles de usuario — espejo de ProfilesController.
 * Alcance **empresa** del JWT: `GET` devuelve los perfiles SYSTEM de la
 * plataforma más los de la empresa del token (array, sin paginar).
 *
 * Nota: crear/editar/borrar perfiles SYSTEM responde `403`; borrar uno con
 * usuarios asignados responde `409`.
 */
class ProfileService {

    async list(): Promise<ApiResponse<ApiProfile[]>> {
        return apiFetch<ApiResponse<ApiProfile[]>>('profiles', {
            method: 'GET',
        });
    }

    async getById(id: number): Promise<ApiResponse<ApiProfile>> {
        return apiFetch<ApiResponse<ApiProfile>>(`profiles/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateProfilePayload): Promise<ApiResponse<ApiProfile>> {
        return apiFetch<ApiResponse<ApiProfile>>('profiles', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(
        id: number,
        payload: UpdateProfilePayload,
    ): Promise<ApiResponse<ApiProfile>> {
        return apiFetch<ApiResponse<ApiProfile>>(`profiles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`profiles/${id}`, {
            method: 'DELETE',
        });
    }

}

export const profileService = new ProfileService();
