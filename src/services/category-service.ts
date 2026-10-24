import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiCategory,
  ApiResponse,
  CreateCategoryPayload,
  ListCategoriesParams,
  Paginated,
  UpdateCategoryPayload,
} from '@/types';

/**
 * Servicio de categorías — espejo de CategoriesController
 * (list, getById, create, update, remove). Alcance sede del JWT.
 *
 * Nota: `remove` en el backend desactiva la categoría (soft delete).
 */
class CategoryService {

    async list(params: ListCategoriesParams = {}): Promise<ApiResponse<Paginated<ApiCategory>>> {
        return apiFetch<ApiResponse<Paginated<ApiCategory>>>(
            `categories${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                search: params.search,
                active: params.active === undefined ? undefined : String(params.active),
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiCategory>> {
        return apiFetch<ApiResponse<ApiCategory>>(`categories/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateCategoryPayload): Promise<ApiResponse<ApiCategory>> {
        return apiFetch<ApiResponse<ApiCategory>>('categories', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(id: number, payload: UpdateCategoryPayload): Promise<ApiResponse<ApiCategory>> {
        return apiFetch<ApiResponse<ApiCategory>>(`categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`categories/${id}`, {
            method: 'DELETE',
        });
    }

}

export const categoryService = new CategoryService();
