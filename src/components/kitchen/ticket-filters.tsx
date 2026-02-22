import { cn } from '@/lib/utils';
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
        <button
          key={filter.type}
          onClick={() => onFilterChange(filter.type)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeFilter === filter.type
              ? 'bg-foreground text-background'
              : 'bg-card border hover:bg-accent'
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
        </button>
      ))}
    </div>
  );
}
