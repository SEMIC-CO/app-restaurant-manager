import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiInvoice,
  ApiInvoiceStatus,
  ApiResponse,
  CreateInvoicePayload,
  ListInvoicesParams,
  Paginated,
} from '@/types';

/**
 * Servicio de facturas — espejo de InvoicesController
 * (create, list, getByOrder, getById, updateStatus, remove). Alcance empresa.
 *
 * La caja usa `create` al cobrar: guarda la factura (con la propina
 * voluntaria aparte en `voluntary_tip`) y deja el pedido como `paid`.
 */
class InvoiceService {
    /** Genera la factura de una orden. `409` si la orden ya tiene factura. */
    async create(payload: CreateInvoicePayload): Promise<ApiResponse<ApiInvoice>> {
        return apiFetch<ApiResponse<ApiInvoice>>('invoices', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /** Factura de una orden (`404` si aún no existe). */
    async getByOrder(orderId: number): Promise<ApiResponse<ApiInvoice>> {
        return apiFetch<ApiResponse<ApiInvoice>>(`invoices/by-order/${orderId}`, {
            method: 'GET',
        });
    }

    /**
     * Listado paginado de facturas (alcance empresa): `search` por número/cliente,
     * `status` y rango de fechas `dateFrom`/`dateTo` (AAAA-MM-DD).
     */
    async list(params: ListInvoicesParams = {}): Promise<ApiResponse<Paginated<ApiInvoice>>> {
        return apiFetch<ApiResponse<Paginated<ApiInvoice>>>(
            `invoices${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                search: params.search,
                status: params.status,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiInvoice>> {
        return apiFetch<ApiResponse<ApiInvoice>>(`invoices/${id}`, {
            method: 'GET',
        });
    }

    /** Cambia el estado de una factura (`paid` | `pending` | `cancelled`). */
    async updateStatus(
        id: number,
        status: ApiInvoiceStatus,
    ): Promise<ApiResponse<ApiInvoice>> {
        return apiFetch<ApiResponse<ApiInvoice>>(`invoices/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

}

export const invoiceService = new InvoiceService();
