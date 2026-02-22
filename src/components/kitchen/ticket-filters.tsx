import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { OrderType } from '@/types';

interface TicketFilter {
  type: 'all' | OrderType;
  label: string;
  count?: number;
}

interface TicketFiltersProps {
  filters: TicketFilter[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

/**
 * Filter tabs for ticket queue (Todos, Para Llevar, Mesa, Delivery)
 */
export function TicketFilters({ filters, activeFilter, onFilterChange }: TicketFiltersProps) {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.type}
          variant={activeFilter === filter.type ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.type)}
          className={cn(
            'gap-2 rounded-full',
            activeFilter === filter.type && 'bg-foreground text-background hover:bg-foreground/90'
          )}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              activeFilter === filter.type
                ? 'bg-background text-foreground'
                : 'bg-muted'
            )}>
              {filter.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
