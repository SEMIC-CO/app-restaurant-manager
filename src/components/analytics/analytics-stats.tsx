import { ClipboardList, Star, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';

interface AnalyticsTopProduct {
  name: string;
  units: number;
}

interface AnalyticsStatsProps {
  /** Pedidos no cancelados creados en el período. */
  totalOrders: number;
  /** Unidades vendidas en el período. */
  totalUnits: number;
  /** Producto más vendido (`null` si no hay ventas). */
  topProduct: AnalyticsTopProduct | null;
  /** Producto menos vendido (`null` si no hay ventas). */
  lowestProduct: AnalyticsTopProduct | null;
}

/**
 * Tarjetas de resumen de Reportes: datos reales del período consultado
 * (sin porcentajes "vs. ayer" inventados).
 */
export function AnalyticsStats({
  totalOrders,
  totalUnits,
  topProduct,
  lowestProduct,
}: AnalyticsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Pedidos realizados */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Pedidos Realizados
            </p>
            <p className="mt-2 text-4xl font-bold">
              {totalOrders.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              No incluye cancelados
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Productos vendidos (unidades) */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Productos Vendidos
            </p>
            <p className="mt-2 text-4xl font-bold">
              {totalUnits.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Unidades en el período
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
            🥟
          </div>
        </div>
      </Card>

      {/* Producto más vendido */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Más Vendido
            </p>
            <p className="mt-2 text-2xl font-bold">
              {topProduct?.name ?? 'Sin datos'}
            </p>
            <p className="mt-2 text-sm text-green-600">
              {topProduct
                ? `${topProduct.units.toLocaleString()} unidades`
                : 'Sin ventas en el período'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-2xl">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </Card>

      {/* Producto menos vendido */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Menos Vendido
            </p>
            <p className="mt-2 text-2xl font-bold">
              {lowestProduct?.name ?? 'Sin datos'}
            </p>
            <p className="mt-2 text-sm text-orange-600">
              {lowestProduct
                ? `${lowestProduct.units.toLocaleString()} unidades`
                : 'Sin ventas en el período'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
