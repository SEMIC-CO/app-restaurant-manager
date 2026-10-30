import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiProduct,
  ApiResponse,
  CreateProductPayload,
  ListProductsParams,
  Paginated,
  UpdateProductPayload,
} from '@/types';

export const productService = {
  // === API real (backend NestJS /products) ===

  /** Lista los productos de la sede (paginado, con búsqueda). */
  async list(params: ListProductsParams = {}): Promise<ApiResponse<Paginated<ApiProduct>>> {
    return apiFetch<ApiResponse<Paginated<ApiProduct>>>(
      `products${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: params.search,
        categoryId: params.categoryId,
        available:
          params.available === undefined ? undefined : String(params.available),
      })}`,
      { method: 'GET' },
    );
  },

  /**
   * Todos los productos de la sede (recorre páginas; el backend limita a 100).
   * `listAllAvailable` es el mismo pero solo con `available=true` (menús).
   */
  async listAll(params: ListProductsParams = {}): Promise<ApiProduct[]> {
    const items: ApiProduct[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const resp = await productService.list({
        ...params,
        page,
        limit: 100,
      });
      if (resp.code !== 200) {
        throw new Error(resp.msg || 'No se pudieron cargar los productos');
      }
      items.push(...resp.data.items);
      totalPages = resp.data.totalPages;
      page += 1;
    } while (page <= totalPages);

    return items;
  },

  async listAllAvailable(categoryId?: number): Promise<ApiProduct[]> {
    return productService.listAll({ categoryId, available: true });
  },

  /** Detalle de un producto (`GET /products/:id`) — precarga del formulario. */
  async getById(id: number): Promise<ApiResponse<ApiProduct>> {
    return apiFetch<ApiResponse<ApiProduct>>(`products/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Crea el producto en el backend (JSON puro).
   * La imagen se sube aparte con `uploadImage()` (multipart).
   */
  async create(payload: CreateProductPayload): Promise<ApiResponse<ApiProduct>> {
    return apiFetch<ApiResponse<ApiProduct>>('products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Actualiza los datos del producto (`PUT /products/:id`). */
  async update(
    id: number,
    payload: UpdateProductPayload,
  ): Promise<ApiResponse<ApiProduct>> {
    return apiFetch<ApiResponse<ApiProduct>>(`products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /** Elimina el producto (el backend borra también su imagen del disco). */
  async remove(id: number): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(`products/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Sube (o reemplaza) la imagen del producto en el campo `file` (FormData).
   *
   * El archivo debe venir pre-comprimido (ver `useImageUpload`): el backend lo
   * recibe en memoria, lo reduce con `sharp` a 1200px/WebP y devuelve el
   * producto con `imageUrl` = ruta relativa (`productos/prod-<uuid>.webp`).
   */
  async uploadImage(productId: number, file: File): Promise<ApiResponse<ApiProduct>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiFetch<ApiResponse<ApiProduct>>(`products/${productId}/image`, {
      method: 'POST',
      body: formData,
    });
  },
};
