import { TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';

interface AnalyticsStatsProps {
  totalSales: number;
  totalSalesChange: number;
  topProduct: string;
  topProductChange: number;
  lowestProduct: string;
  lowestProductChange: number;
}

/**
 * Stats cards for analytics dashboard
 */
export function AnalyticsStats({ 
  totalSales, 
  totalSalesChange,
  topProduct,
  topProductChange,
  lowestProduct,
  lowestProductChange,
}: AnalyticsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Sales */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Total Vendidas
            </p>
            <p className="mt-2 text-4xl font-bold">{totalSales.toLocaleString()}</p>
            <div className={`mt-2 flex items-center gap-1 text-sm ${totalSalesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalSalesChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{totalSalesChange >= 0 ? '+' : ''}{totalSalesChange}% vs. ayer</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
            🥟
          </div>
        </div>
      </Card>

      {/* Top Product */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Estrella del Día
            </p>
            <p className="mt-2 text-2xl font-bold">{topProduct}</p>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+{topProductChange}% en popularidad</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-2xl">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </Card>

      {/* Lowest Product */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase">
              Menos Vendida
            </p>
            <p className="mt-2 text-2xl font-bold">{lowestProduct}</p>
            <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span>{lowestProductChange}% necesita promoción</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
