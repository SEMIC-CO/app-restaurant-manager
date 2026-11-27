import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiMeasurementUnit,
  ApiResponse,
  CreateMeasurementUnitPayload,
  ListMeasurementUnitsParams,
  Paginated,
  UpdateMeasurementUnitPayload,
} from '@/types';

/**
 * Servicio de unidades de medida — espejo de
 * `GET/POST/PUT/DELETE /inventory/measurement-units`.
 *
 * `delete` es un soft delete: el backend pone `is_active = false` (la unidad
 * puede estar en uso por artículos o movimientos).
 */
class InventoryMeasurementUnitService {
  async list(
    params: ListMeasurementUnitsParams = {},
  ): Promise<ApiResponse<Paginated<ApiMeasurementUnit>>> {
    return apiFetch<ApiResponse<Paginated<ApiMeasurementUnit>>>(
      `inventory/measurement-units${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        search: params.search,
        isActive:
          params.isActive === undefined ? undefined : String(params.isActive),
      })}`,
      { method: 'GET' },
    );
  }

  /**
   * Catálogo completo iterando todas las páginas (para selects).
   * Pasa `{ isActive: true }` para listar solo las unidades activas.
   */
  async getAll(
    params: ListMeasurementUnitsParams = {},
  ): Promise<ApiMeasurementUnit[]> {
    const units: ApiMeasurementUnit[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 10) {
      const resp = await this.list({ ...params, page, limit: 100 });
      if (resp.code !== 200) break;
      units.push(...resp.data.items);
      totalPages = resp.data.totalPages;
      page++;
    }

    return units;
  }

  async create(
    payload: CreateMeasurementUnitPayload,
  ): Promise<ApiResponse<ApiMeasurementUnit>> {
    return apiFetch<ApiResponse<ApiMeasurementUnit>>(
      'inventory/measurement-units',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  async update(
    id: number,
    payload: UpdateMeasurementUnitPayload,
  ): Promise<ApiResponse<ApiMeasurementUnit>> {
    return apiFetch<ApiResponse<ApiMeasurementUnit>>(
      `inventory/measurement-units/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  }

  /** Desactiva la unidad (soft delete: `is_active = false`). */
  async deactivate(id: number): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(`inventory/measurement-units/${id}`, {
      method: 'DELETE',
    });
  }
}

export const inventoryMeasurementUnitService =
  new InventoryMeasurementUnitService();
