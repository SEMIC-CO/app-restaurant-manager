import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type { ApiPermission, ApiResponse, Paginated } from '@/types';

/** Límite del catálogo: `GET /permissions` pagina (máx. 100 por página). */
const PAGE_SIZE = 100;

/**
 * Servicio de permisos — espejo de PermissionsController. Solo se consume
 * para asignar módulos a un perfil (`PUT /profiles/:id/permissions`).
 */
class PermissionService {
  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    return apiFetch<ApiResponse<Paginated<ApiPermission>>>(
      `permissions${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? PAGE_SIZE,
        search: params.search,
      })}`,
      { method: 'GET' },
    );
  }

  /** Todos los permisos del catálogo (recorre las páginas del endpoint). */
  async listAll(): Promise<ApiResponse<ApiPermission[]>> {
    const items: ApiPermission[] = [];
    let page = 1;
    let last!: ApiResponse<Paginated<ApiPermission>>;

    for (;;) {
      last = await this.list({ page, limit: PAGE_SIZE });
      if (last.code !== 200) return { ...last, data: items };
      items.push(...last.data.items);
      if (page >= (last.data.totalPages ?? 1)) break;
      page += 1;
    }

    return { ...last, data: items };
  }
}

export const permissionService = new PermissionService();
