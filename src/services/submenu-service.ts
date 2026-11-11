import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type { ApiResponse, ApiSubmenu, Paginated } from '@/types';

/** Límite del catálogo: `GET /submenus` pagina (máx. 100 por página). */
const PAGE_SIZE = 100;

/**
 * Servicio de submenús — espejo de SubmenusController. Se usa para pintar los
 * permisos por perfil (el sidebar del login ya trae sus submenús anidados).
 */
class SubmenuService {
  async list(params: { page?: number; limit?: number; menuId?: number } = {}) {
    return apiFetch<ApiResponse<Paginated<ApiSubmenu>>>(
      `submenus${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? PAGE_SIZE,
        menuId: params.menuId,
      })}`,
      { method: 'GET' },
    );
  }

  /** Todos los submenús del catálogo (recorre las páginas del endpoint). */
  async listAll(): Promise<ApiResponse<ApiSubmenu[]>> {
    const items: ApiSubmenu[] = [];
    let page = 1;
    let last!: ApiResponse<Paginated<ApiSubmenu>>;

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

export const submenuService = new SubmenuService();
