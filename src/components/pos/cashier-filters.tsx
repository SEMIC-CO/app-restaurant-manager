import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Vistas del área principal de la caja: pedidos activos o mesas ocupadas. */
export type CashierView = 'pedidos' | 'mesas';

interface CashierFilter {
  id: CashierView;
  label: string;
  count?: number;
}

interface CashierFiltersProps {
  filters: CashierFilter[];
  activeView: CashierView;
  onViewChange: (view: CashierView) => void;
}

/**
 * Filtros de la caja (Pedidos / Mesas): pestañas con el conteo real de
 * cada vista. Al elegir una se listan los pedidos activos o las mesas
 * ocupadas, listos para cargar en el ticket con un clic.
 */
export function CashierFilters({ filters, activeView, onViewChange }: CashierFiltersProps) {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          type="button"
          variant={activeView === filter.id ? 'default' : 'outline'}
          onClick={() => onViewChange(filter.id)}
          className={cn(
            'gap-2 rounded-full',
            activeView === filter.id && 'bg-foreground text-background hover:bg-foreground/90'
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                activeView === filter.id
                  ? 'bg-background text-foreground'
                  : 'bg-muted'
              )}
            >
              {filter.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
