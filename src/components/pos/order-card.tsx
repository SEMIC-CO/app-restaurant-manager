import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatCurrency, formatOrderNumber, formatTableLabel } from '@/utils';
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_BADGE_CLASSES,
  ORDER_TYPE_LABELS,
} from './order-labels';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * Tarjeta de pedido: número, tipo, estado, mesa, cliente y total.
 * Se usa en la lista de Pedidos (/pedidos) y en el filtro Pedidos de la caja.
 */
export function OrderCard({ order, selected = false, onSelect }: OrderCardProps) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-primary tabular-nums">
          {formatOrderNumber(order.orderNumber)}
        </span>
        <span className="text-lg font-bold text-foreground">{formatCurrency(order.total)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`px-2 py-1 text-[10px] uppercase font-medium ${ORDER_TYPE_BADGE_CLASSES[order.type]}`}
        >
          {ORDER_TYPE_LABELS[order.type]}
        </Badge>
        <Badge
          variant="outline"
          className={`px-2 py-1 text-[10px] uppercase font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm">
        <div className="min-w-0 space-y-0.5 text-left">
          <p className="font-medium">{formatTableLabel(order.tableNumber)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {order.customerName || 'Sin cliente'}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p>{units} producto(s)</p>
          <p>
            {new Date(order.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </button>
  );
}
