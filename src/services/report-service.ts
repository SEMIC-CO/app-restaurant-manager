import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type { ApiResponse, DashboardReport, FinancialReport, SalesReport } from '@/types';

interface SalesReportParams {
  /** Fecha inicial `AAAA-MM-DD` (inclusive). */
  dateFrom?: string;
  /** Fecha final `AAAA-MM-DD` (inclusive). */
  dateTo?: string;
}

/**
 * Servicio de reportes — espejo de ReportsController (`GET /reports/sales`
 * y `GET /reports/dashboard`).
 */
class ReportService {
  async getSalesReport(
    params: SalesReportParams = {},
  ): Promise<ApiResponse<SalesReport>> {
    return apiFetch<ApiResponse<SalesReport>>(
      `reports/sales${buildQuery({
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`,
      { method: 'GET' },
    );
  }

  /**
   * Reporte financiero del rango: ingresos (facturas cobradas: `pending` +
   * `emitted`, por método de pago), egresos (nómina + compras + gastos
   * operativos) y ganancia neta.
   */
  async getFinancialReport(
    params: SalesReportParams = {},
  ): Promise<ApiResponse<FinancialReport>> {
    return apiFetch<ApiResponse<FinancialReport>>(
      `reports/financial${buildQuery({
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      })}`,
      { method: 'GET' },
    );
  }

  /**
   * Dashboard del día: KPIs con comparativa al día anterior, pedidos
   * activos, salón, alertas y últimos pedidos.
   *
   * `date` es la fecha **local** del cliente (`AAAA-MM-DD`); si no se envía,
   * el backend usa la del servidor.
   */
  async getDashboard(date?: string): Promise<ApiResponse<DashboardReport>> {
    return apiFetch<ApiResponse<DashboardReport>>(
      `reports/dashboard${buildQuery({ date })}`,
      { method: 'GET' },
    );
  }
}

export const reportService = new ReportService();
