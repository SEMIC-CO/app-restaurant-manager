import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  ApiPaymentEmployee,
  ApiPaymentHistoryRow,
  CreatePaymentEmployeePayload,
  ListPaymentHistoryParams,
  ListPaymentEmployeesParams,
  Paginated,
  UpdatePaymentEmployeePayload,
} from '@/types';

/**
 * Servicio de pagos de nómina — espejo de PaymentsEmployeesController.
 * `employeeId` es obligatorio en el listado (alcance sede vía empleado).
 *
 * Nota: `remove` en el backend anula el pago (status → `VOIDED`).
 */
class PaymentEmployeeService {
    async list(
        params: ListPaymentEmployeesParams,
    ): Promise<ApiResponse<Paginated<ApiPaymentEmployee>>> {
        return apiFetch<ApiResponse<Paginated<ApiPaymentEmployee>>>(
            `payments-employees${buildQuery({
                employeeId: params.employeeId,
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                status: params.status,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiPaymentEmployee>> {
        return apiFetch<ApiResponse<ApiPaymentEmployee>>(`payments-employees/${id}`, {
            method: 'GET',
        });
    }

    /**
     * Historial de pagos de la SEDE (todos los empleados), con filtros por
     * estado y rango de período. Devuelve el nombre del empleado.
     */
    async history(
        params: ListPaymentHistoryParams = {},
    ): Promise<ApiResponse<Paginated<ApiPaymentHistoryRow>>> {
        return apiFetch<ApiResponse<Paginated<ApiPaymentHistoryRow>>>(
            `payments-employees/history${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                status: params.status,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            })}`,
            { method: 'GET' },
        );
    }

    async create(payload: CreatePaymentEmployeePayload): Promise<ApiResponse<ApiPaymentEmployee>> {
        return apiFetch<ApiResponse<ApiPaymentEmployee>>('payments-employees', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(
        id: number,
        payload: UpdatePaymentEmployeePayload,
    ): Promise<ApiResponse<ApiPaymentEmployee>> {
        return apiFetch<ApiResponse<ApiPaymentEmployee>>(`payments-employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    /** Anulación lógica: el pago pasa a `VOIDED`. */
    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`payments-employees/${id}`, {
            method: 'DELETE',
        });
    }

}

export const paymentEmployeeService = new PaymentEmployeeService();
