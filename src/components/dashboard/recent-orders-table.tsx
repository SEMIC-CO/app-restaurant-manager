import { Card } from '@/components/ui';
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
} from '@/components/pos';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import type { RecentOrder } from '@/types';

interface RecentOrdersTableProps {
  /** Pedidos del día, del más reciente al más antiguo. */
  orders: RecentOrder[];
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * "Últimos Movimientos" del dashboard: los pedidos reales del día en lugar
 * de la lista hardcodeada que había antes.
 */
export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Últimos movimientos</h2>
          <p className="text-sm text-muted-foreground">
            Pedidos de hoy, del más reciente al más antiguo
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {orders.length === 0
            ? 'Sin pedidos'
            : orders.length === 1
              ? '1 pedido'
              : `${orders.length} pedidos`}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          Todavía no hay pedidos hoy.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 text-sm font-medium">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {order.customerName ?? 'Sin nombre'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {timeOf(order.orderDatetime)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                        ORDER_STATUS_BADGE_CLASSES[order.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
