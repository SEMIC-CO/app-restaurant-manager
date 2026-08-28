import { useState } from "react";
import { Download, Pencil } from "lucide-react";
import {
  AnalyticsStats,
  AnalyticsFilters,
  FlavorRankingChart,
  SalesMixChart,
  ProductTable,
} from "@/components/analytics";
import { Button } from "@/components/ui";
import { ConfigLayout } from "@/app/layout";
import { ConfigSidebar } from "@/components/common";

// Mock data
const flavorRankings = [
  { name: "Carne Suave", sales: 420, maxSales: 420 },
  { name: "Carne Picante", sales: 355, maxSales: 420 },
  { name: "Jamón y Queso", sales: 298, maxSales: 420 },
  { name: "Pollo", sales: 220, maxSales: 420 },
  { name: "Verdura", sales: 145, maxSales: 420 },
];

const categoryMix = [
  { name: "Carne", percentage: 60, color: "#f97316" },
  { name: "Quesos y Veggie", percentage: 25, color: "#eab308" },
  { name: "Especiales", percentage: 15, color: "#84cc16" },
];

const productRows = [
  {
    id: "1",
    name: "Carne Suave",
    description: "Receta tradicional",
    category: "Carne",
    categoryColor: "#f97316",
    sales: 420,
    revenue: 840,
    status: "popular" as const,
  },
  {
    id: "2",
    name: "Carne Picante",
    description: "Con ají molido",
    category: "Carne",
    categoryColor: "#f97316",
    sales: 355,
    revenue: 710,
    status: "popular" as const,
  },
  {
    id: "3",
    name: "Jamón y Queso",
    description: "Clásico",
    category: "Quesos",
    categoryColor: "#eab308",
    sales: 298,
    revenue: 596,
    status: "normal" as const,
  },
  {
    id: "4",
    name: "Verdura",
    description: "Acelga y salsa blanca",
    category: "Veggie",
    categoryColor: "#84cc16",
    sales: 145,
    revenue: 290,
    status: "low-stock" as const,
  },
];

const timeFilters = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta Semana" },
  { id: "month", label: "Este Mes" },
  { id: "custom", label: "📅 Personalizado" },
];

/**
 * Analytics page - Product performance and sales insights
 */
export function AnalyticsPage() {
  const [activeFilter, setActiveFilter] = useState("today");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Análisis de Productos</h1>
              <p className="text-muted-foreground">
                Desempeño del menú e inventario en tiempo real
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar Menú
              </Button>
            </div>
          </div>

          {/* Time filters */}
          <AnalyticsFilters
            filters={timeFilters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Stats cards */}
          <AnalyticsStats
            totalSales={1240}
            totalSalesChange={12}
            topProduct="Carne Suave"
            topProductChange={5}
            lowestProduct="Humita"
            lowestProductChange={-2}
          />

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <FlavorRankingChart
              flavors={flavorRankings}
              onViewDetails={() => console.log("View details")}
            />
            <SalesMixChart categories={categoryMix} />
          </div>

          {/* Products table */}
          <ProductTable
            products={productRows}
            currentPage={currentPage}
            totalPages={3}
            onPageChange={setCurrentPage}
            onAction={(id) => console.log("Action on product:", id)}
          />
        </div>
      }
    />
  );
}
