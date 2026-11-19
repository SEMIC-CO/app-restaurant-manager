import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  AnalyticsStats,
  AnalyticsFilters,
  FlavorRankingChart,
  SalesMixChart,
  ProductTable,
  FinancialReportSection,
} from "@/components/analytics";
import { Button, Input, Label } from "@/components/ui";
import { ConfigLayout } from "@/app/layout";
import { ConfigSidebar } from "@/components/common";
import { toast } from "@/hooks";
import { reportService } from "@/services";
import { downloadCsv, formatRangeLabel, toISODate } from "@/utils";
import type { ApiResponse, SalesReport } from "@/types";

type PeriodId = "today" | "week" | "month" | "custom";

/** Secciones de `/reportes`: cada una carga sus datos solo al entrar. */
type ReportSectionId = "productos" | "financiero";

const reportSections = [
  { id: "productos", label: "Análisis de Productos" },
  { id: "financiero", label: "Reporte Financiero" },
];

const timeFilters = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta Semana" },
  { id: "month", label: "Este Mes" },
  { id: "custom", label: "📅 Personalizado" },
];

/** Paleta de respaldo cuando una categoría no trae color hex. */
const MIX_COLORS = ["#f97316", "#eab308", "#84cc16", "#0ea5e9", "#a855f7", "#ef4444"];
const DEFAULT_COLOR = "#71717a";

/** Filas por página del detalle de productos. */
const PAGE_SIZE = 5;

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

/** Color usable en CSS (hex) o fallback de la paleta. */
function mixColor(color: string | null, index: number): string {
  return color && HEX_COLOR.test(color) ? color : MIX_COLORS[index % MIX_COLORS.length];
}

/**
 * Rango de fechas del período activo (`custom` = fechas elegidas, vacío = todo).
 * Misma semántica que Facturación: "Hoy" = día actual, "Esta Semana" = últimos
 * 7 días, "Este Mes" = desde el día 1.
 */
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
      return { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  }
}

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(", ");
  return resp.msg || fallback;
}

/**
 * Reportes de la sede, en dos secciones:
 *
 * - **Análisis de Productos** (`GET /reports/sales`): desempeño del menú con
 *   pedidos del día/semana/mes o rango personalizado (sin cancelados).
 * - **Reporte Financiero** (`GET /reports/financial`): ingresos, egresos y
 *   rentabilidad. Se monta **solo al entrar en su pestaña** (carga perezosa)
 *   y se vuelve a consultar con "Actualizar" o al cambiar el período.
 */
export function AnalyticsPage() {
  const [activeSection, setActiveSection] = useState<ReportSectionId>("productos");
  const [activeFilter, setActiveFilter] = useState<PeriodId>("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const range = useMemo(
    () => getPeriodRange(activeFilter, dateFrom, dateTo),
    [activeFilter, dateFrom, dateTo],
  );

  // Cambiar de período (o de fechas) reinicia la paginación de la tabla.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, dateFrom, dateTo]);

  // El análisis de productos carga al entrar a la página (una sola vez por
  // rango); la sección financiera carga por separado al montarse.
  useEffect(() => {
    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const resp = await reportService.getSalesReport(range);
        if (!active) return;
        if (resp.code === 200 && resp.data) {
          setReport(resp.data);
        } else {
          toast({
            variant: "warning",
            title: "❌ Error al cargar el reporte",
            description: apiErrorMessage(resp, "No se pudieron cargar los datos."),
          });
        }
      } catch {
        if (active) {
          toast({
            variant: "warning",
            title: "❌ Error al cargar el reporte",
            description: "No se pudo conectar con el servidor.",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [range]);

  const products = report?.products ?? [];
  const summary = report?.summary;

  // Ranking: top 5 unidades, escalado contra el producto líder.
  const topUnits = products[0]?.units ?? 0;
  const ranking = products.slice(0, 5).map((product) => ({
    name: product.name,
    sales: product.units,
    maxSales: topUnits || 1,
  }));

  // Mix por categorías (unidades del período).
  const mix = (report?.categoryMix ?? []).map((entry, index) => ({
    name: entry.name,
    percentage: entry.percentage,
    color: mixColor(entry.color, index),
  }));

  // Detalle de productos (ya viene ordenado de mayor a menor).
  const tableRows = products.map((product, index) => ({
    id: String(product.productId),
    name: product.name,
    description: product.description ?? "Sin descripción",
    category: product.categoryName ?? "Sin categoría",
    categoryColor:
      product.categoryColor && HEX_COLOR.test(product.categoryColor)
        ? product.categoryColor
        : DEFAULT_COLOR,
    sales: product.units,
    revenue: product.revenue,
    status:
      index === 0
        ? ("popular" as const)
        : products.length > 1 && index === products.length - 1
          ? ("lowest" as const)
          : ("normal" as const),
  }));

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const pageRows = tableRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const scrollToDetails = () => {
    document
      .getElementById("detalle-productos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Exporta el análisis completo (resumen, productos y mix) a CSV. */
  const handleExport = () => {
    if (!report) return;

    const rows: Array<Array<string | number>> = [
      ["Análisis de productos", formatRangeLabel(report.range)],
      [],
      ["Resumen"],
      ["Pedidos (sin cancelados)", report.summary.totalOrders],
      ["Unidades vendidas", report.summary.totalUnits],
      [
        "Producto más vendido",
        report.summary.topProduct
          ? `${report.summary.topProduct.name} (${report.summary.topProduct.units} u.)`
          : "—",
      ],
      [
        "Producto menos vendido",
        report.summary.lowestProduct
          ? `${report.summary.lowestProduct.name} (${report.summary.lowestProduct.units} u.)`
          : "—",
      ],
      [],
      ["Productos (de mayor a menor por unidades)"],
      ["Producto", "Categoría", "Unidades", "Ingresos"],
      ...report.products.map((product) => [
        product.name,
        product.categoryName ?? "Sin categoría",
        product.units,
        product.revenue,
      ]),
      [],
      ["Mix de categorías"],
      ["Categoría", "Unidades", "Porcentaje (%)"],
      ...report.categoryMix.map((entry) => [
        entry.name,
        entry.units,
        entry.percentage,
      ]),
    ];

    downloadCsv("analisis-productos", ["Análisis de productos"], rows);
    toast({
      title: "📥 Reporte exportado",
      description: "Archivo CSV descargado.",
    });
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeSection === "productos"
                  ? "Desempeño del menú e inventario en tiempo real"
                  : "Ingresos, egresos y rentabilidad de la sede"}
              </p>
            </div>
            {activeSection === "productos" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExport}
                  disabled={!report}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            )}
          </div>

          {/* Secciones de reportes: cada una carga sus datos solo al entrar */}
          <AnalyticsFilters
            filters={reportSections}
            activeFilter={activeSection}
            onFilterChange={(id) => setActiveSection(id as ReportSectionId)}
          />

          {activeSection === "financiero" ? (
            <FinancialReportSection />
          ) : (
            <>
              {/* Time filters */}
              <div className="space-y-3">
                <AnalyticsFilters
                  filters={timeFilters}
                  activeFilter={activeFilter}
                  onFilterChange={(filterId) =>
                    setActiveFilter(filterId as PeriodId)
                  }
                />

                {/* Personalizado: rango de fechas libre */}
                {activeFilter === "custom" && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="report-date-from"
                        className="text-xs text-muted-foreground"
                      >
                        Desde
                      </Label>
                      <Input
                        id="report-date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="w-44"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="report-date-to"
                        className="text-xs text-muted-foreground"
                      >
                        Hasta
                      </Label>
                      <Input
                        id="report-date-to"
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
              ) : (
                <>
                  {/* Stats cards (datos reales del período) */}
                  <AnalyticsStats
                    totalOrders={summary?.totalOrders ?? 0}
                    totalUnits={summary?.totalUnits ?? 0}
                    topProduct={
                      summary?.topProduct
                        ? {
                            name: summary.topProduct.name,
                            units: summary.topProduct.units,
                          }
                        : null
                    }
                    lowestProduct={
                      summary?.lowestProduct
                        ? {
                            name: summary.lowestProduct.name,
                            units: summary.lowestProduct.units,
                          }
                        : null
                    }
                  />

                  {/* Charts row */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <FlavorRankingChart
                      flavors={ranking}
                      onViewDetails={scrollToDetails}
                    />
                    <SalesMixChart categories={mix} />
                  </div>

                  {/* Products table */}
                  <div id="detalle-productos">
                    <ProductTable
                      products={pageRows}
                      totalItems={tableRows.length}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      onAction={(id) => console.log("Action on product:", id)}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
