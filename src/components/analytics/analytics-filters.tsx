import { cn } from '@/lib/utils';

interface TimeFilter {
  id: string;
  label: string;
}

interface AnalyticsFiltersProps {
  filters: TimeFilter[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

/**
 * Time period filter tabs for analytics
 */
export function AnalyticsFilters({ filters, activeFilter, onFilterChange }: AnalyticsFiltersProps) {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border hover:bg-accent'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
