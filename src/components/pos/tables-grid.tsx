import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { Users, BedDouble as BedDoubleIcon } from 'lucide-react';
import type { FloorTable, FloorTableStatus } from '@/types';

interface TablesGridProps {
  tables: FloorTable[];
  onSelectTable?: (table: FloorTable) => void;
  loading?: boolean;
}

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
export function TablesGrid({ tables, onSelectTable, loading }: TablesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BedDoubleIcon className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="mt-4 text-muted-foreground">
          No hay mesas en esta área.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {tables.map((table) => {
        const config = STATUS_CONFIG[table.floorStatus];
        const isClickable = Boolean(onSelectTable);

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => isClickable && onSelectTable?.(table)}
            className={cn(
              'group relative flex aspect-square flex-col justify-between rounded-xl border p-3 text-left transition-all',
              'shadow-sm hover:shadow-md hover:-translate-y-0.5',
              config.className,
              isClickable ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            {/* Status dot + status label */}
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-offset-background', config.dot)}
                />
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {config.label}
                </span>
              </span>

              {/* Capacidad */}
              <Badge
                variant="secondary"
                className="h-6 px-1.5 text-[11px] font-medium"
              >
                <Users className="h-3 w-3" />
                {table.cantPeople}
              </Badge>
            </div>

            {/* Icono + nombre principal */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center transition-transform group-hover:scale-110 text-primary">
                <BedDoubleIcon className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.75} />
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                {table.name}
              </div>
              {Boolean(table.orderNumber) && (
                <div className="mt-0.5 text-[11px] font-medium text-primary">
                  {table.orderNumber}
                </div>
              )}
              {Boolean(table.customerName) && (
                <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {table.customerName}
                </div>
              )}
            </div>

            {/* Footer - Sección */}
            <div className="flex justify-end">
              <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {table.sectionName}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
