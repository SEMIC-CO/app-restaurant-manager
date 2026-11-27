import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiInventoryItem,
  ApiInventoryItemUnit,
  ApiResponse,
  CreateInventoryItemPayload,
  CreateInventoryItemUnitPayload,
  ListInventoryItemsParams,
  Paginated,
  UpdateInventoryItemPayload,
  UpdateInventoryItemUnitPayload,
} from '@/types';

/**
 * Servicio de artículos de inventario — espejo de InventoryItemsController
 * (list, getById, create, update, remove, units).
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

  /**
   * Unidades del artículo (`inventory_item_units`): array plano **sin
   * paginación** (fila base + alternativas con su factor de conversión).
   */
  async listUnits(
    itemId: number,
  ): Promise<ApiResponse<ApiInventoryItemUnit[]>> {
    return apiFetch<ApiResponse<ApiInventoryItemUnit[]>>(
      `inventory/items/${itemId}/units`,
      { method: 'GET' },
    );
  }

  /** Agrega una unidad al artículo (409 si esa unidad ya está configurada). */
  async createUnit(
    itemId: number,
    payload: CreateInventoryItemUnitPayload,
  ): Promise<ApiResponse<ApiInventoryItemUnit>> {
    return apiFetch<ApiResponse<ApiInventoryItemUnit>>(
      `inventory/items/${itemId}/units`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  /** Actualiza una fila de unidad del artículo (404 si no pertenece al artículo). */
  async updateUnit(
    itemId: number,
    unitId: number,
    payload: UpdateInventoryItemUnitPayload,
  ): Promise<ApiResponse<ApiInventoryItemUnit>> {
    return apiFetch<ApiResponse<ApiInventoryItemUnit>>(
      `inventory/items/${itemId}/units/${unitId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  }

  /**
   * Quita una unidad del artículo. El backend la rechaza con `409` si es la
   * fila **base** del artículo (no se puede quitar la unidad base).
   */
  async deleteUnit(
    itemId: number,
    unitId: number,
  ): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(
      `inventory/items/${itemId}/units/${unitId}`,
      { method: 'DELETE' },
    );
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
