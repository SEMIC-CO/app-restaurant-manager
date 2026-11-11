import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiMenu,
  ApiNavigation,
  ApiResponse,
  Paginated,
} from '@/types';

/** Límite del catálogo: `GET /menus` pagina (máx. 100 por página). */
const PAGE_SIZE = 100;

/**
 * Servicio de menús — espejo de MenusController.
 *
 * El catálogo es global (no depende de empresa ni sede). Lo relevante para la
 * app es `getMine()`: el sidebar que corresponde al perfil del JWT.
 */
class MenuService {
  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    return apiFetch<ApiResponse<Paginated<ApiMenu>>>(
      `menus${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? PAGE_SIZE,
        search: params.search,
      })}`,
      { method: 'GET' },
    );
  }

  /** Todos los menús del catálogo (recorre las páginas del endpoint). */
  async listAll(): Promise<ApiResponse<ApiMenu[]>> {
    const items: ApiMenu[] = [];
    let page = 1;
    let last!: ApiResponse<Paginated<ApiMenu>>;

    for (;;) {
      last = await this.list({ page, limit: PAGE_SIZE });
      if (last.code !== 200) return { ...last, data: items };
      items.push(...last.data.items);
      if (page >= (last.data.totalPages ?? 1)) break;
      page += 1;
    }

    return { ...last, data: items };
  }

  /** Sidebar del usuario autenticado (`user.profileId`). */
  async getMine(): Promise<ApiResponse<ApiNavigation>> {
    return apiFetch<ApiResponse<ApiNavigation>>('menus/mine', {
      method: 'GET',
    });
  }
}

export const menuService = new MenuService();
