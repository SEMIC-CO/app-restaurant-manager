import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FilterTabItem {
  id: string;
  /** Contenido de la píldora (texto e ícono opcional). */
  label: ReactNode;
  /** Conteo opcional: chip numérico al estilo de los filtros de Pedidos. */
  count?: number;
}

interface FilterTabsProps {
  items: FilterTabItem[];
  /** Id del filtro activo. */
  active: string;
  onChange: (id: string) => void;
  /** Clases extra del contenedor (p.ej. `overflow-x-auto` para no envolver). */
  className?: string;
  /** `aria-label` del grupo de filtros. */
  label?: string;
}

/**
 * Filtros tipo píldora con **el estilo único de la app** (el de Mesas y
 * Pedidos): `rounded-lg` con borde, activo en `bg-primary` y chip de
 * conteo opcional.
 *
 * Lo usan: Mesas y categorías (`CategoryTabs`), Pedidos, Caja
 * (`CashierFilters`), Cocina y Entregas (`TicketFilters`), Reportes
 * (`AnalyticsFilters`) e Inventario. Así todos los módulos muestran sus
 * filtros idénticos.
 */
export function FilterTabs({
  items,
  active,
  onChange,
  className,
  label,
}: FilterTabsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs',
                  isActive
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
