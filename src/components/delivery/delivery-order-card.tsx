import { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
} from '@/components/pos';
import { formatCurrency, formatOrderNumber, formatRelativeTime } from '@/utils';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

interface DeliveryOrderCardProps {
  order: Order;
  /** `true` mientras se envía la entrega: deshabilita el botón. */
  busy?: boolean;
  /** Se pinta solo en pedidos `ready` (los demás no se entregan desde aquí). */
  onDeliver?: (orderId: string) => void;
}

/**
 * Tarjeta de pedido para Entregas: cabecera con el badge del estado real,
 * desglose de ítems (desplegable), total y —si el pedido está listo— el
 * botón "Entregar Pedido" que lo pasa de `ready` a `delivered`.
 */
export function DeliveryOrderCard({ order, busy = false, onDeliver }: DeliveryOrderCardProps) {
  const timeAgo = formatRelativeTime(order.createdAt);
  /** Despliega el desglose completo de ítems. */
  const [showAllItems, setShowAllItems] = useState(false);

  const visibleItems = showAllItems ? order.items : order.items.slice(0, 3);
  const hiddenItems = order.items.length - visibleItems.length;
  const isReady = order.status === 'ready';

  return (
    <Card
      className={cn('p-3', isReady && 'border-emerald-500/40 bg-emerald-500/5')}
    >
      {/* Header: Order number + Status + Time */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            {formatOrderNumber(order.orderNumber)}
          </span>
          <Badge
            variant="outline"
            className={cn('text-[11px]', ORDER_STATUS_BADGE_CLASSES[order.status])}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Customer name */}
      {order.customerName && (
        <p className="mt-1.5 text-sm font-medium">{order.customerName}</p>
      )}

      {/* Order items summary */}
      <div className="mt-2 space-y-1">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">
              {item.quantity}x {item.productName}
            </span>
            <span className="shrink-0 tabular-nums">{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
        {hiddenItems > 0 && (
          <button
            type="button"
            onClick={() => setShowAllItems(true)}
            className="text-sm text-primary hover:underline"
          >
            +{hiddenItems} más...
          </button>
        )}
        {showAllItems && order.items.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllItems(false)}
            className="text-sm text-muted-foreground hover:underline"
          >
            Ocultar detalles
          </button>
        )}
      </div>

      {/* Total */}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-base font-bold text-primary tabular-nums">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Actions: solo los pedidos listos se entregan desde la tarjeta */}
      {isReady && (
        <div className="mt-3">
          <Button
            className="w-full gap-2"
            disabled={busy}
            onClick={() => onDeliver?.(order.id)}
          >
            <CheckCircle className="h-4 w-4" />
            {busy ? 'Entregando…' : 'Entregar Pedido'}
          </Button>
        </div>
      )}
    </Card>
  );
}
