import { apiFetch } from './useFetch';
import type {
    ApiResponse,
    ApiPayrollPreviewRow,
    ApiPayrollTemplate,
    ApiPayrollTemplateRow,
    CreatePaymentsBatchPayload,
    BatchPaymentResult,
    PreviewPayrollPayload,
    UpsertPayrollTemplatePayload,
} from '@/types';

/**
 * Servicio de nómina — espejo de PayrollTemplatesController y del pago en
 * lote de PaymentsEmployeesController. Alcance sede del JWT.
 */
class PayrollService {

    /**
     * Nómina configurada de la sede: empleados con su plantilla de pago.
     * Los que no tienen configuración aparecen con `template: null`.
     */
    async listTemplates(active = false): Promise<ApiResponse<ApiPayrollTemplateRow[]>> {
        return apiFetch<ApiResponse<ApiPayrollTemplateRow[]>>(
            `payroll-templates${active ? '?active=true' : ''}`,
            { method: 'GET' },
        );
    }

    /** Configura (o reconfigura) el pago de un empleado. Un registro por empleado. */
    async upsertTemplate(
        employeeId: number,
        payload: UpsertPayrollTemplatePayload,
    ): Promise<ApiResponse<ApiPayrollTemplate>> {
        return apiFetch<ApiResponse<ApiPayrollTemplate>>(
            `payroll-templates/${employeeId}`,
            { method: 'PUT', body: JSON.stringify(payload) },
        );
    }

    /** Desactiva la configuración; el histórico de pagos no se toca. */
    async deactivateTemplate(employeeId: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`payroll-templates/${employeeId}`, {
            method: 'DELETE',
        });
    }

    /** Cálculo previo de la nómina de un período (sugeridos + ajustes pendientes). */
    async preview(payload: PreviewPayrollPayload): Promise<ApiResponse<ApiPayrollPreviewRow[]>> {
        return apiFetch<ApiResponse<ApiPayrollPreviewRow[]>>('payroll-templates/preview', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Pago en lote: crea varios pagos en una sola transacción y aplica los
     * ajustes pendientes de los empleados pagados.
     */
    async createBatch(
        payload: CreatePaymentsBatchPayload,
    ): Promise<ApiResponse<BatchPaymentResult>> {
        return apiFetch<ApiResponse<BatchPaymentResult>>('payments-employees/batch', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

}

export const payrollService = new PayrollService();
