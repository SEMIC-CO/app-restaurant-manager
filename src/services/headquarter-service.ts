import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
    ApiResponse,
    Headquarters,
    ListHeadquartersParams,
    Paginated,
} from '@/types';

/**
 * Servicio de sedes — espejo de HeadquartersController
 * (list, getById). Alcance **empresa** del JWT: solo devuelve sedes de la
 * compañía del token (el backend responde 404 si el id es de otra empresa).
 */
class HeadquarterService {

    async list(params: ListHeadquartersParams = {}): Promise<ApiResponse<Paginated<Headquarters>>> {
        return apiFetch<ApiResponse<Paginated<Headquarters>>>(
            `headquarters${buildQuery({ page: params.page ?? 1, limit: params.limit ?? 20, search: params.search })}`,
            { method: 'GET' },
        );
    }

    /**
     * Detalle de una sede. Para la sede del usuario se usa
     * `user.headquarterId` de la sesión (`useCurrentHeadquarter`).
     */
    async getById(id: number): Promise<ApiResponse<Headquarters>> {
        return apiFetch<ApiResponse<Headquarters>>(`headquarters/${id}`, {
            method: 'GET',
        });
    }

}

export const headquarterService = new HeadquarterService();
