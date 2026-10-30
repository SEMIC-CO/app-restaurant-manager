import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { Users, BedDouble as BedDoubleIcon } from 'lucide-react';
import type { FloorTable, FloorTableStatus } from '@/types';

interface TablesGridProps {
  tables: FloorTable[];
  onSelectTable?: (table: FloorTable) => void;
  /** Resalta la mesa seleccionada (borde primario). */
  selectedId?: number | null;
  loading?: boolean;
  /**
   * `sm` = cards compactas (≈136px) para popups (p.ej. el selector de mesas
   * del pedido); por defecto la cuadrícula de la vista de mesas (≈200px).
   */
  size?: 'default' | 'sm';
}

/**
 * Cuadrícula con ancho de celda ~200px (12.5rem) o ~136px (8.5rem en `sm`).
 * En pantallas donde no caben, `min(100%, X)` reduce el ancho para evitar overflow.
 */
const GRID_CLASS = {
  default:
    'grid grid-cols-[repeat(auto-fill,minmax(min(100%,12.5rem),12.5rem))] gap-4',
  sm: 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),8.5rem))] gap-2',
};

const STATUS_CONFIG: Record<FloorTableStatus, { label: string; className: string; border: string; dot: string }> = {
  available: {
    label: 'Libre',
    className: 'bg-card hover:bg-primary/5 border-border',
    border: 'border-border',
    dot: 'bg-green-500',
  },
  occupied: {
    label: 'Ocupada',
    className: 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
  },
};

/**
 * Cuadrícula visual de mesas del local.
 *
 * Cada mesa se presenta como un "cuadrito" (aspect ratio 1:1) con:
 * - Icono de silla
 * - Nombre
 * - Sección (chip)
 * - Capacidad (icono + número)
 * - Estado visualizado (Libre / Ocupada)
 */
export function TablesGrid({ tables, onSelectTable, selectedId, loading, size = 'default' }: TablesGridProps) {
  const compact = size === 'sm';
  const grid = GRID_CLASS[size];

  if (loading) {
    return (
      <div className={grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <BedDoubleIcon
          className={cn('text-muted-foreground/50', compact ? 'h-10 w-10' : 'h-16 w-16')}
          strokeWidth={1.5}
        />
        <p className={cn('mt-3 text-muted-foreground', compact ? 'text-sm' : 'mt-4')}>
          No hay mesas en esta área.
        </p>
      </div>
    );
  }

  return (
    <div className={grid}>
      {tables.map((table) => {
        const config = STATUS_CONFIG[table.floorStatus];
        const isClickable = Boolean(onSelectTable);
        const isSelected = selectedId != null && table.id === selectedId;

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => isClickable && onSelectTable?.(table)}
            className={cn(
              'group relative flex aspect-square flex-col justify-between rounded-xl border text-left transition-all',
              'shadow-sm hover:shadow-md hover:-translate-y-0.5',
              compact ? 'gap-1 p-2' : 'p-3',
              config.className,
              isClickable ? 'cursor-pointer' : 'cursor-default',
              isSelected && 'border-primary ring-2 ring-primary/40',
            )}
          >
            {/* Status dot + status label */}
            <div className="flex items-start justify-between gap-1">
              <span className="inline-flex items-center gap-1">
                <span
                  className={cn(
                    'rounded-full ring-2 ring-offset-background',
                    compact ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5',
                    config.dot,
                  )}
                />
                <span
                  className={cn(
                    'font-medium uppercase tracking-wide text-muted-foreground',
                    compact ? 'text-[9px]' : 'text-[11px]',
                  )}
                >
                  {config.label}
                </span>
              </span>

              {/* Capacidad */}
              <Badge
                variant="secondary"
                className={cn(
                  'font-medium',
                  compact ? 'h-4 px-1 text-[9px]' : 'h-6 px-1.5 text-[11px]',
                )}
              >
                <Users className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                {table.cantPeople}
              </Badge>
            </div>

            {/* Icono + nombre principal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={cn(
                  'flex items-center justify-center text-primary transition-transform group-hover:scale-110',
                  compact ? 'h-6 w-6' : 'h-10 w-10 sm:h-12 sm:w-12',
                )}
              >
                <BedDoubleIcon
                  className={cn(compact ? 'h-6 w-6' : 'h-8 w-8 sm:h-10 sm:w-10')}
                  strokeWidth={1.75}
                />
              </div>
              <div
                className={cn(
                  'font-semibold text-foreground',
                  compact ? 'text-xs' : 'mt-2 text-sm sm:text-base',
                )}
              >
                {table.name}
              </div>
              {!compact && Boolean(table.orderNumber) && (
                <div className="mt-0.5 text-[11px] font-medium text-primary">
                  {table.orderNumber}
                </div>
              )}
              {!compact && Boolean(table.customerName) && (
                <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {table.customerName}
                </div>
              )}
            </div>

            {/* Footer - Sección */}
            <div className="flex justify-end">
              <span
                className={cn(
                  'rounded-md bg-muted/60 uppercase tracking-wider text-muted-foreground',
                  compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]',
                )}
              >
                {table.sectionName}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
