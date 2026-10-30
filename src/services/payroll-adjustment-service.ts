import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  ApiPayrollAdjustment,
  CreatePayrollAdjustmentPayload,
  ListPayrollAdjustmentsParams,
  Paginated,
  UpdatePayrollAdjustmentPayload,
} from '@/types';

/**
 * Servicio de ajustes de nómina (adelantos, bonos, descuentos) — espejo de
 * PayrollAdjustmentsController. `employeeId` es obligatorio en el listado
 * (alcance sede vía empleado).
 *
 * Nota: `remove` en el backend cancela el ajuste (status → `CANCELLED`).
 */
class PayrollAdjustmentService {
    async list(
        params: ListPayrollAdjustmentsParams,
    ): Promise<ApiResponse<Paginated<ApiPayrollAdjustment>>> {
        return apiFetch<ApiResponse<Paginated<ApiPayrollAdjustment>>>(
            `payroll-adjustments${buildQuery({
                employeeId: params.employeeId,
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                status: params.status,
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiPayrollAdjustment>> {
        return apiFetch<ApiResponse<ApiPayrollAdjustment>>(`payroll-adjustments/${id}`, {
            method: 'GET',
        });
    }

    async create(
        payload: CreatePayrollAdjustmentPayload,
    ): Promise<ApiResponse<ApiPayrollAdjustment>> {
        return apiFetch<ApiResponse<ApiPayrollAdjustment>>('payroll-adjustments', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(
        id: number,
        payload: UpdatePayrollAdjustmentPayload,
    ): Promise<ApiResponse<ApiPayrollAdjustment>> {
        return apiFetch<ApiResponse<ApiPayrollAdjustment>>(`payroll-adjustments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    /** Anulación lógica: el ajuste pasa a `CANCELLED`. */
    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`payroll-adjustments/${id}`, {
            method: 'DELETE',
        });
    }

}

export const payrollAdjustmentService = new PayrollAdjustmentService();
