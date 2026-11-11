import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  CreateInventoryCategoryPayload,
  ListInventoryCategoriesParams,
  Paginated,
  UpdateInventoryCategoryPayload,
  ApiInventoryCategory,
} from '@/types';

/**
 * Servicio de categorías de inventario — espejo de InventoryCategoriesController
 * (list, create, update, remove). Alcance empresa del JWT.
 *
 * Nota: `remove` en el backend desactiva la categoría (soft delete).
 */
class InventoryCategoryService {
  async list(
    params: ListInventoryCategoriesParams = {},
  ): Promise<ApiResponse<Paginated<ApiInventoryCategory>>> {
    return apiFetch<ApiResponse<Paginated<ApiInventoryCategory>>>(
      `inventory/categories${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        search: params.search,
        isActive:
          params.isActive === undefined ? undefined : String(params.isActive),
      })}`,
      { method: 'GET' },
    );
  }

  async create(
    payload: CreateInventoryCategoryPayload,
  ): Promise<ApiResponse<ApiInventoryCategory>> {
    return apiFetch<ApiResponse<ApiInventoryCategory>>('inventory/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(
    id: number,
    payload: UpdateInventoryCategoryPayload,
  ): Promise<ApiResponse<ApiInventoryCategory>> {
    return apiFetch<ApiResponse<ApiInventoryCategory>>(
      `inventory/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(`inventory/categories/${id}`, {
      method: 'DELETE',
    });
  }
}

export const inventoryCategoryService = new InventoryCategoryService();
