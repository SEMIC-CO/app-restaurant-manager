import { FilterTabs } from '@/components/common';

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
 * Filtros de la caja (Pedidos / Mesas) con el conteo real de cada vista.
 * Delega en `FilterTabs` (estilo único de filtros de la app).
 */
export function CashierFilters({ filters, activeView, onViewChange }: CashierFiltersProps) {
  return (
    <FilterTabs
      items={filters.map((filter) => ({
        id: filter.id,
        label: filter.label,
        count: filter.count,
      }))}
      active={activeView}
      onChange={(id) => onViewChange(id as CashierView)}
      label="Filtrar vista de caja"
    />
  );
}
