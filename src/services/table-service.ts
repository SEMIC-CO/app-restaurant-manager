import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  CreateTablePayload,
  ListTablesParams,
  Paginated,
  RestaurantTable,
  UpdateTablePayload,
} from '@/types';

/**
 * Servicio de mesas — espejo de TablesController
 * (list, getById, create, update, remove). Alcance sede vía sección.
 *
 * `status` es el flag de activación de la mesa (ACTIVO/INACTIVO); el estado
 * ocupada/libre lo deriva el front a partir de las órdenes activas.
 */
class TableService {

    async list(params: ListTablesParams = {}): Promise<ApiResponse<Paginated<RestaurantTable>>> {
        return apiFetch<ApiResponse<Paginated<RestaurantTable>>>(
            `tables${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                search: params.search,
                sectionId: params.sectionId,
                status: params.status,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<RestaurantTable>> {
        return apiFetch<ApiResponse<RestaurantTable>>(`tables/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateTablePayload): Promise<ApiResponse<RestaurantTable>> {
        return apiFetch<ApiResponse<RestaurantTable>>('tables', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(id: number, payload: UpdateTablePayload): Promise<ApiResponse<RestaurantTable>> {
        return apiFetch<ApiResponse<RestaurantTable>>(`tables/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`tables/${id}`, {
            method: 'DELETE',
        });
    }

}

export const tableService = new TableService();
