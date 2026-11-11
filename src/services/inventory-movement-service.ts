import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiInventoryMovement,
  ApiResponse,
  CreateInventoryMovementPayload,
  ListInventoryMovementsParams,
  Paginated,
} from '@/types';

/**
 * Servicio de movimientos de inventario (kardex) — espejo de
 * InventoryMovementsController. Alcance sede del JWT.
 *
 * `list`, `create` y `void`: los movimientos son **append-only** (no se editan
 * ni se borran). Un dato mal digitado se corrige con `void` (anula: lo saca del
 * stock y del costo vigente, queda marcado con motivo) o con un movimiento
 * contrario registrado con `create`.
 */
class InventoryMovementService {
  async list(
    params: ListInventoryMovementsParams = {},
  ): Promise<ApiResponse<Paginated<ApiInventoryMovement>>> {
    return apiFetch<ApiResponse<Paginated<ApiInventoryMovement>>>(
      `inventory/movements${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        inventoryItemId: params.inventoryItemId,
        movementType: params.movementType,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        search: params.search,
      })}`,
      { method: 'GET' },
    );
  }

  async create(
    payload: CreateInventoryMovementPayload,
  ): Promise<ApiResponse<ApiInventoryMovement>> {
    return apiFetch<ApiResponse<ApiInventoryMovement>>('inventory/movements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Anula un movimiento mal digitado: el backend lo marca con `voidedAt`,
   * `voidedBy` y `voidReason`, lo saca del stock y del costo vigente y lo deja
   * en el historial. `200` con el movimiento anulado; `404` si no existe o es
   * de otra sede; `409` si ya estaba anulado.
   */
  async void(
    id: number,
    reason: string,
  ): Promise<ApiResponse<ApiInventoryMovement>> {
    return apiFetch<ApiResponse<ApiInventoryMovement>>(
      `inventory/movements/${id}/void`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }
}

export const inventoryMovementService = new InventoryMovementService();
