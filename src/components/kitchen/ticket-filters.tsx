import { FilterTabs } from '@/components/common';
import type { OrderStatus, OrderType } from '@/types';

/**
 * `'completados'` = pedidos ya listos o entregados (fuera de la cola activa).
 * Se aceptan también los **estados** para filtros como los de Entregas.
 */
type TicketFilterType = 'all' | OrderType | 'completados' | OrderStatus;

interface TicketFilter {
  type: TicketFilterType;
  label: string;
  count?: number;
}

interface TicketFiltersProps {
  filters: TicketFilter[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

/**
 * Filtros de la cola de tickets (Todos, Para Llevar, Mesa, Delivery,
 * Listos / Entregados) usados en Cocina y Entregas. Delega en
 * `FilterTabs` (estilo único de filtros de la app).
 */
export function TicketFilters({ filters, activeFilter, onFilterChange }: TicketFiltersProps) {
  return (
    <FilterTabs
      items={filters.map((filter) => ({
        id: filter.type,
        label: filter.label,
        count: filter.count,
      }))}
      active={activeFilter}
      onChange={onFilterChange}
      label="Filtrar tickets"
    />
  );
}
