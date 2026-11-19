import * as React from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { AnalyticsFilters, FinancialKpiCards } from '@/components/analytics';
import { Button, Card, Input, Label } from '@/components/ui';
import { toast } from '@/hooks';
import { reportService } from '@/services';
import { downloadCsv, formatCurrency, formatRangeLabel, toISODate } from '@/utils';
import type { FinancialReport } from '@/types';

type PeriodId = 'today' | 'week' | 'month' | 'custom';

const timeFilters = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
  { id: 'custom', label: '📅 Personalizado' },
];

const PAYMENT_LABELS: Record<string, string> = {
  Cash: 'Efectivo',
  Card: 'Tarjeta',
  Transfer: 'Transferencia',
  'Sin definir': 'Sin definir',
};

const EXPENSE_LABELS = {
  payroll: 'Nómina pagada',
  purchases: 'Compras de insumos',
  operating: 'Gastos operativos',
} as const;

/**
 * Rango de fechas del período activo (misma semántica que Reportes:
 * "Hoy" = día actual, "Esta Semana" = últimos 7 días, "Este Mes" = desde
 * el día 1; vacío = todo el histórico).
 */
function getPeriodRange(
  period: PeriodId,
  dateFrom: string,
  dateTo: string,
): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  switch (period) {
    case 'today': {
      const today = toISODate(now);
      return { dateFrom: today, dateTo: today };
    }
    case 'week': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { dateFrom: toISODate(from), dateTo: toISODate(now) };
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: toISODate(from), dateTo: toISODate(now) };
    }
    default:
      return { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  }
}

/**
 * Sección de reporte financiero dentro de `/reportes`.
 *
 * **Carga perezosa**: solo consulta `GET /reports/financial` cuando la
 * sección entra en pantalla (el padre la monta al elegir la pestaña) o cuando
 * el usuario cambia el período / pulsa "Actualizar". Al salir de la pestaña
 * se desmonta y la próxima entrada vuelve a consultar.
 */
export function FinancialReportSection() {
  const [activeFilter, setActiveFilter] = React.useState<PeriodId>('today');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [report, setReport] = React.useState<FinancialReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  const range = React.useMemo(
    () => getPeriodRange(activeFilter, dateFrom, dateTo),
    [activeFilter, dateFrom, dateTo],
  );

  /** Descarta respuestas obsoletas cuando el rango cambia a mitad de vuelo. */
  const requestSeq = React.useRef(0);

  const load = React.useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const resp = await reportService.getFinancialReport(range);
      if (seq !== requestSeq.current) return; // respuesta obsoleta
      if (resp.code === 200 && resp.data) {
        setReport(resp.data);
      } else {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar el reporte',
          description: resp.msg || 'No se pudieron cargar los datos.',
        });
      }
    } catch {
      if (seq !== requestSeq.current) return;
      toast({
        variant: 'warning',
        title: '❌ Error al cargar el reporte',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [range]);

  // Entra la sección (o cambia el período) → consulta.
  React.useEffect(() => {
    void load();
  }, [load]);

  const income = report?.income;
  const expenses = report?.expenses;
  const profit = report?.profit;

  const methodRows = income?.byMethod ?? [];

  const handleExportCsv = () => {
    if (!report) return;

    const rows: Array<Array<string | number>> = [
      ['Reporte financiero', formatRangeLabel(report.range)],
      [],
      ['Concepto', 'Monto'],
      ['Total ingresos', report.income.total],
      ['Propinas (aparte)', report.income.tips],
      ['Total egresos', report.expenses.total],
      ['Ganancia neta', report.profit.net],
      ['Margen neto (%)', report.profit.marginPct],
      [],
      ['Ingresos por método de pago'],
      ['Método', 'Facturas', 'Total', 'Propinas'],
      ...methodRows.map((row) => [
        PAYMENT_LABELS[row.method] ?? row.method,
        row.invoices,
        row.total,
        row.tips,
      ]),
      [],
      ['Egresos por tipo'],
      ['Tipo', 'Monto'],
      ['Nómina pagada', report.expenses.payroll],
      ['Compras de insumos', report.expenses.purchases],
      ['Gastos operativos', report.expenses.operating],
      ['Total egresos', report.expenses.total],
    ];

    downloadCsv('reporte-financiero', ['Reporte financiero'], rows);
    toast({
      title: '📥 Reporte exportado',
      description: 'Archivo CSV descargado.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Reporte Financiero</h2>
          <p className="text-sm text-muted-foreground">
            Ingresos, egresos y rentabilidad — flujo simple del período
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCsv}
            disabled={!report}
          >
            <Download className="h-4 w-4" />
            Descargar CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.print()}
            disabled={!report}
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Filtros de período */}
      <div className="space-y-3 print:hidden">
        <AnalyticsFilters
          filters={timeFilters}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId as PeriodId)}
        />

        {activeFilter === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="financial-date-from"
                className="text-xs text-muted-foreground"
              >
                Desde
              </Label>
              <Input
                id="financial-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="financial-date-to"
                className="text-xs text-muted-foreground"
              >
                Hasta
              </Label>
              <Input
                id="financial-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="w-44"
              />
            </div>
          </div>
        )}
      </div>

      {loading && !report ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Cargando reporte…
        </p>
      ) : report ? (
        <>
          {/* KPIs del período */}
          <FinancialKpiCards
            income={income?.total ?? 0}
            expenses={expenses?.total ?? 0}
            net={profit?.net ?? 0}
            marginPct={profit?.marginPct ?? 0}
            tips={income?.tips ?? 0}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Ingresos por método de pago */}
            <Card className="overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold">Ingresos por Método de Pago</h3>
                <p className="text-sm text-muted-foreground">
                  Facturas cobradas (pendientes o emitidas) · propinas aparte
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-y bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Método
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                        Facturas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                        Propinas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {methodRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-sm text-muted-foreground"
                        >
                          Sin ingresos en el período.
                        </td>
                      </tr>
                    )}
                    {methodRows.map((row) => (
                      <tr key={row.method} className="border-b last:border-b-0">
                        <td className="px-6 py-4 text-sm font-medium">
                          {PAYMENT_LABELS[row.method] ?? row.method}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {row.invoices}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold">
                          {formatCurrency(row.total)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {row.tips > 0 ? formatCurrency(row.tips) : '—'}
                        </td>
                      </tr>
                    ))}
                    {methodRows.length > 0 && (
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-6 py-4 text-sm">Total</td>
                        <td className="px-6 py-4 text-right text-sm">
                          {methodRows.reduce(
                            (sum, row) => sum + row.invoices,
                            0,
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {formatCurrency(income?.total ?? 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {formatCurrency(income?.tips ?? 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Egresos por tipo */}
            <Card className="overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold">Egresos por Tipo</h3>
                <p className="text-sm text-muted-foreground">
                  Nómina, compras de insumos y gastos operativos
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-y bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(EXPENSE_LABELS) as Array<
                      keyof typeof EXPENSE_LABELS
                    >).map((key) => (
                      <tr key={key} className="border-b">
                        <td className="px-6 py-4 text-sm font-medium">
                          {EXPENSE_LABELS[key]}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {formatCurrency(expenses?.[key] ?? 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-6 py-4 text-sm">Total egresos</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(expenses?.total ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Resumen del resultado */}
          <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase">
                Resultado del período
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  (profit?.net ?? 0) < 0 ? 'text-red-600' : ''
                }`}
              >
                {formatCurrency(profit?.net ?? 0)}
                <span className="ml-2 text-base font-medium text-muted-foreground">
                  ({profit?.marginPct ?? 0}% margen)
                </span>
              </p>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Flujo simple: ingresos de facturas cobradas (pendientes o
              emitidas) menos nómina pagada, compras de insumos y gastos
              operativos. Las propinas ({formatCurrency(income?.tips ?? 0)}) no
              entran en ingresos: son del mesero.
            </p>
          </Card>
        </>
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No hay datos para mostrar.
        </p>
      )}
    </div>
  );
}
