import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiOrder,
  ApiResponse,
  CreateOrderPayload,
  ListOrdersParams,
  Paginated,
  UpdateOrderPayload,
} from '@/types';

/**
 * Servicio de órdenes — espejo de OrdersController
 * (list, getById, create, update, remove). Alcance sede del JWT.
 *
 * El front lo usa sobre todo para derivar el estado ocupada/libre de las
 * mesas a partir de las órdenes sin pagar (pending/preparing/ready/delivered).
 */
class OrderService {

    async list(params: ListOrdersParams = {}): Promise<ApiResponse<Paginated<ApiOrder>>> {
        return apiFetch<ApiResponse<Paginated<ApiOrder>>>(
            `orders${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                status: params.status,
                search: params.search,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiOrder>> {
        return apiFetch<ApiResponse<ApiOrder>>(`orders/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateOrderPayload): Promise<ApiResponse<ApiOrder>> {
        return apiFetch<ApiResponse<ApiOrder>>('orders', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(id: number, payload: UpdateOrderPayload): Promise<ApiResponse<ApiOrder>> {
        return apiFetch<ApiResponse<ApiOrder>>(`orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    /** Reemplaza los ítems del pedido y recalcula totales (PUT /orders/:id/items). */
    async updateItems(
        id: number,
        items: { productId: number; quantity: number }[],
    ): Promise<ApiResponse<ApiOrder>> {
        return apiFetch<ApiResponse<ApiOrder>>(`orders/${id}/items`, {
            method: 'PUT',
            body: JSON.stringify({ items }),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`orders/${id}`, {
            method: 'DELETE',
        });
    }

}

export const orderService = new OrderService();
