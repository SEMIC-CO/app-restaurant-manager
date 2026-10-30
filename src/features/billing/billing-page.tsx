import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BillingSidebar,
  InvoiceTable,
  BillingFooter,
  type Invoice,
} from "@/components/billing";
import { ConfigSidebar, AppHeader } from "@/components/common";
import { toast } from "@/hooks";
import { invoiceService } from "@/services";
import type { ApiInvoice, ApiResponse } from "@/types";

/** Facturas por petición y tope de páginas del histórico. */
const PAGE_LIMIT = 100;
const MAX_PAGES = 10;

type PeriodId = "today" | "week" | "month" | "custom";

/** Rótulo del total del footer según el período activo. */
const PERIOD_LABELS: Record<PeriodId, string> = {
  today: "Total Facturado Hoy",
  week: "Total Facturado Esta Semana",
  month: "Total Facturado Este Mes",
  custom: "Total Facturado (Rango)",
};

/** `AAAA-MM-DD` en horario local (no el de UTC). */
function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Rango de fechas del período activo (`custom` = fechas elegidas, vacío = todo). */
function getPeriodRange(
  period: PeriodId,
  dateFrom: string,
  dateTo: string,
): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  switch (period) {
    case "today": {
      const today = toISODate(now);
      return { dateFrom: today, dateTo: today };
    }
    case "week": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { dateFrom: toISODate(from), dateTo: toISODate(now) };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: toISODate(from), dateTo: toISODate(now) };
    }
    default:
      return {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
  }
}

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(", ");
  return resp.msg || fallback;
}

/** Factura del backend → modelo de la tabla del histórico. */
function toInvoice(api: ApiInvoice): Invoice {
  const date = new Date(api.invoiceDatetime);
  return {
    id: String(api.id),
    invoiceNumber: api.invoiceNumber,
    date: date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    customerName: api.customerName?.trim() || "Consumidor Final",
    customerEmail: api.customerEmail ?? undefined,
    status: api.status,
    total: Number(api.total),
    tip: Number(api.voluntaryTip ?? 0),
  };
}

/**
 * Billing page — histórico de facturas **reales** de la empresa
 * (`GET /invoices`) con búsqueda, filtro por período (hoy/semana/mes/rango)
 * y totales calculados sobre los datos del backend.
 *
 * Estructura row única (sin doble wrap):
 *   [Aside Nav (lg+) 220px] | [col AppHeader | row (Aside métodos pago + main+footer)]
 */
export function BillingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePeriod, setActivePeriod] = useState<PeriodId>("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(
    () => getPeriodRange(activePeriod, dateFrom, dateTo),
    [activePeriod, dateFrom, dateTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const collected: ApiInvoice[] = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const resp = await invoiceService.list({
          page,
          limit: PAGE_LIMIT,
          ...range,
        });
        if (resp.code !== 200) {
          toast({
            variant: "warning",
            title: "❌ Error al cargar facturas",
            description: apiErrorMessage(resp, "No se pudieron cargar las facturas."),
          });
          return;
        }
        collected.push(...resp.data.items);
        if (page >= resp.data.totalPages) break;
      }
      setInvoices(collected.map(toInvoice));
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al cargar facturas",
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleViewDetails = (invoiceId: string) => {
    navigate(`/facturacion/${invoiceId}`);
  };

  const handleExportExcel = () => console.log("Exporting to Excel...");
  const handlePrintReport = () => window.print();

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace(/^#/, "");
    if (!query) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query) ||
        (inv.customerEmail ?? "").toLowerCase().includes(query),
    );
  }, [invoices, searchQuery]);

  // El total facturado excluye las facturas canceladas
  const totalAmount = useMemo(
    () =>
      filteredInvoices
        .filter((inv) => inv.status !== "cancelled")
        .reduce((sum, inv) => sum + inv.total, 0),
    [filteredInvoices],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      {/* 1) Navigation sidebar (lg+, al lado del header) */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      {/* 2) Right column: AppHeader + content row */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        {/* Inner content row: (BillingSidebar métodos + main/column) */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* 2a) Billing sidebar - búsqueda + períodos (lg+) */}
          <aside className="hidden w-[240px] flex-shrink-0 lg:block h-full overflow-y-auto">
            <BillingSidebar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activePeriod={activePeriod}
              onPeriodChange={(period) => setActivePeriod(period as PeriodId)}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </aside>

          {/* 2b) Main + footer en columna */}
          <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
            <main className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">
                    Listado Histórico de Facturas
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-600">Terminal Conectada</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
                    <span className="text-4xl">⏳</span>
                    <p className="mt-4 font-medium">Cargando facturas…</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Consultando el histórico de la empresa
                    </p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
                    <span className="text-4xl">🧾</span>
                    <p className="mt-4 font-medium">No hay facturas</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoices.length === 0
                        ? "Aún no se ha facturado ningún pedido en este período."
                        : "No hay facturas con esa búsqueda."}
                    </p>
                  </div>
                ) : (
                  <InvoiceTable
                    invoices={filteredInvoices}
                    onViewDetails={handleViewDetails}
                  />
                )}
              </div>
            </main>

            <footer className="flex-shrink-0">
              <BillingFooter
                totalAmount={totalAmount}
                invoiceCount={filteredInvoices.length}
                totalLabel={PERIOD_LABELS[activePeriod]}
                onExportExcel={handleExportExcel}
                onPrintReport={handlePrintReport}
              />
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
