import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiInventoryItem,
  ApiResponse,
  CreateInventoryItemPayload,
  ListInventoryItemsParams,
  Paginated,
  UpdateInventoryItemPayload,
} from '@/types';

/**
 * Servicio de artículos de inventario — espejo de InventoryItemsController
 * (list, getById, create, update, remove).
 *
 * `list`/`getById` devuelven `currentStock` (stock de la sede del JWT).
 * `remove` en el backend desactiva el artículo (soft delete).
 */
class InventoryItemService {
  async list(
    params: ListInventoryItemsParams = {},
  ): Promise<ApiResponse<Paginated<ApiInventoryItem>>> {
    return apiFetch<ApiResponse<Paginated<ApiInventoryItem>>>(
      `inventory/items${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        search: params.search,
        inventoryCategoryId: params.inventoryCategoryId,
        isActive:
          params.isActive === undefined ? undefined : String(params.isActive),
      })}`,
      { method: 'GET' },
    );
  }

  async getById(id: number): Promise<ApiResponse<ApiInventoryItem>> {
    return apiFetch<ApiResponse<ApiInventoryItem>>(`inventory/items/${id}`, {
      method: 'GET',
    });
  }

  async create(
    payload: CreateInventoryItemPayload,
  ): Promise<ApiResponse<ApiInventoryItem>> {
    return apiFetch<ApiResponse<ApiInventoryItem>>('inventory/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(
    id: number,
    payload: UpdateInventoryItemPayload,
  ): Promise<ApiResponse<ApiInventoryItem>> {
    return apiFetch<ApiResponse<ApiInventoryItem>>(`inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(`inventory/items/${id}`, {
      method: 'DELETE',
    });
  }
}

export const inventoryItemService = new InventoryItemService();
