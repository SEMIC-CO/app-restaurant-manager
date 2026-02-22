import { Card, Button } from '@/components/ui';

interface FlavorRanking {
  name: string;
  sales: number;
  maxSales: number;
}

interface FlavorRankingChartProps {
  flavors: FlavorRanking[];
  onViewDetails?: () => void;
}

/**
 * Horizontal bar chart showing sales ranking by flavor
 */
export function FlavorRankingChart({ flavors, onViewDetails }: FlavorRankingChartProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Ranking de Sabores</h3>
          <p className="text-sm text-muted-foreground">Volumen de ventas por variedad</p>
        </div>
        <Button 
          variant="link"
          onClick={onViewDetails}
          className="text-sm"
        >
          Ver detalles
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {flavors.map((flavor) => (
          <div key={flavor.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{flavor.name}</span>
              <span className="font-medium">{flavor.sales}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(flavor.sales / flavor.maxSales) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
