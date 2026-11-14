import { FlavorRankingChart, SalesMixChart } from '@/components/analytics';
import type { ReportCategoryMix, ReportProductSales } from '@/types';

interface TopProductsPanelProps {
  /** Productos con ventas del día, de mayor a menor. */
  products: ReportProductSales[];
  categoryMix: ReportCategoryMix[];
  /** Se omite si el perfil no tiene el módulo Reportes. */
  onViewDetails?: () => void;
}

/** Misma paleta de respaldo que Reportes cuando una categoría no trae color. */
const MIX_COLORS = [
  '#f97316',
  '#eab308',
  '#84cc16',
  '#0ea5e9',
  '#a855f7',
  '#ef4444',
];
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

function mixColor(color: string | null, index: number): string {
  return color && HEX_COLOR.test(color)
    ? color
    : MIX_COLORS[index % MIX_COLORS.length];
}

/**
 * Ranking de productos y mix de categorías del día, reusando los mismos
 * gráficos de la pantalla de Reportes (`GET /reports/dashboard` →
 * `products` y `categoryMix`).
 */
export function TopProductsPanel({
  products,
  categoryMix,
  onViewDetails,
}: TopProductsPanelProps) {
  const topUnits = products[0]?.units ?? 0;
  const ranking = products.slice(0, 5).map((product) => ({
    name: product.name,
    sales: product.units,
    maxSales: topUnits || 1,
  }));

  const mix = categoryMix.map((entry, index) => ({
    name: entry.name,
    percentage: entry.percentage,
    color: mixColor(entry.color, index),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FlavorRankingChart flavors={ranking} onViewDetails={onViewDetails} />
      <SalesMixChart categories={mix} />
    </div>
  );
}
