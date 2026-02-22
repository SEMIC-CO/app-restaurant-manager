import { Card } from '@/components/ui';

interface CategoryMix {
  name: string;
  percentage: number;
  color: string;
}

interface SalesMixChartProps {
  categories: CategoryMix[];
  totalLabel?: string;
}

/**
 * Donut chart showing sales distribution by category
 */
export function SalesMixChart({ categories, totalLabel = 'VENTAS' }: SalesMixChartProps) {
  return (
    <Card className="p-6">
      <div>
        <h3 className="font-semibold">Mix de Ventas</h3>
        <p className="text-sm text-muted-foreground">Distribución por categoría</p>
      </div>

      <div className="mt-6 flex items-center justify-center">
        {/* Donut chart placeholder */}
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-r from-primary via-yellow-400 to-green-400 p-4">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card">
            <span className="text-3xl font-bold">100%</span>
            <span className="text-xs text-muted-foreground">{totalLabel}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <span>{category.name}</span>
            </div>
            <span className="font-medium">{category.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
