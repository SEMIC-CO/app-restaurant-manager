import { Card } from '@/components/ui';
import { ORDER_STATUS_LABELS } from '@/components/pos';
import { cn } from '@/lib/utils';
import type { ActiveOrdersSummary, TablesSummary } from '@/types';

interface ActiveOrdersPanelProps {
  activeOrders: ActiveOrdersSummary;
  tables: TablesSummary;
  className?: string;
}

/** Los estados que mantienen una cuenta abierta (sin cobrar). */
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready', 'delivered'] as const;

const STATUS_TONES: Record<(typeof ACTIVE_STATUSES)[number], string> = {
  pending: 'text-amber-600 dark:text-amber-400',
  preparing: 'text-blue-600 dark:text-blue-400',
  ready: 'text-emerald-600 dark:text-emerald-400',
  delivered: 'text-gray-600 dark:text-gray-400',
};

/**
 * Salón en vivo: pedidos por estado (pendiente / en preparación / lista /
 * entregada) y ocupación de mesas. Se refresca con los eventos del socket.
 * La mesa se libera cuando la caja factura el pedido (`paid`).
 */
export function ActiveOrdersPanel({
  activeOrders,
  tables,
  className,
}: ActiveOrdersPanelProps) {
  const percent =
    tables.total > 0 ? Math.round((tables.occupied * 100) / tables.total) : 0;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Salón en vivo</h3>
          <p className="text-sm text-muted-foreground">
            {activeOrders.total === 0
              ? 'Sin pedidos pendientes'
              : activeOrders.total === 1
                ? '1 pedido sin pagar'
                : `${activeOrders.total} pedidos sin pagar`}
          </p>
        </div>
        <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          En vivo
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {ACTIVE_STATUSES.map((status) => (
          <div
            key={status}
            className="rounded-lg border bg-background p-3 text-center"
          >
            <p className="text-2xl font-bold">{activeOrders[status]}</p>
            <p
              className={cn('mt-1 text-xs font-medium', STATUS_TONES[status])}
            >
              {ORDER_STATUS_LABELS[status]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Mesas ocupadas</span>
          <span className="font-medium">
            {tables.occupied} / {tables.total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {tables.available === 0
            ? 'No hay mesas disponibles'
            : tables.available === 1
              ? '1 mesa disponible'
              : `${tables.available} mesas disponibles`}
        </p>
      </div>
    </Card>
  );
}
