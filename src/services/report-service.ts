import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type { ApiResponse, SalesReport } from '@/types';

interface SalesReportParams {
  /** Fecha inicial `AAAA-MM-DD` (inclusive). */
  dateFrom?: string;
  /** Fecha final `AAAA-MM-DD` (inclusive). */
  dateTo?: string;
}

/**
 * Servicio de reportes — espejo de ReportsController (`GET /reports/sales`).
 * Devuelve resumen (pedidos, unidades, más/menos vendido), ranking y detalle
 * por producto del rango consultado, más el mix por categorías.
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
}

export const reportService = new ReportService();
