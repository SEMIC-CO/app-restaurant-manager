import { FilterTabs } from '@/components/common';

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
 * Filtros de Reportes (secciones y períodos). Delega en `FilterTabs`
 * (estilo único de filtros de la app).
 */
export function AnalyticsFilters({ filters, activeFilter, onFilterChange }: AnalyticsFiltersProps) {
  return (
    <FilterTabs
      items={filters.map((filter) => ({ id: filter.id, label: filter.label }))}
      active={activeFilter}
      onChange={onFilterChange}
      label="Filtrar reportes"
    />
  );
}
