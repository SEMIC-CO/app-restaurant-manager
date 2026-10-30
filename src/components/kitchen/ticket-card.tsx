import { CheckCircle, StickyNote } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { formatOrderNumber, formatTableLabel } from '@/utils';
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
} from '../pos/order-labels';
import type { Order, OrderType } from '@/types';

interface TicketCardProps {
  order: Order;
  onMarkReady?: (orderId: string) => void;
  /** Actualización de estado en curso (deshabilita el botón). */
  updating?: boolean;
}

function getTimeBadgeStatus(minutes: number) {
  if (minutes >= 15) return 'urgent';
  if (minutes >= 10) return 'warning';
  return 'normal';
}

function formatWaitTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins < 1) return `${diffSecs}s`;
  return `${diffMins} min`;
}

function getOrderTypeIcon(type: OrderType): string {
  switch (type) {
    case 'para-llevar': return '🛍️';
    case 'mesa': return '🍽️';
    case 'domicilio': return '🚗';
    default: return '📦';
  }
}

function getOrderTypeLabel(type: OrderType, tableNumber?: string): string {
  switch (type) {
    case 'mesa': return tableNumber ? formatTableLabel(tableNumber) : 'Mesa';
    case 'para-llevar': return 'Para Llevar';
    case 'domicilio': return 'Domicilio';
    default: return '';
  }
}

/**
 * Ticket card for kitchen display showing order items and wait time
 */
export function TicketCard({ order, onMarkReady, updating = false }: TicketCardProps) {
  // Ticket finalizado: ya está listo (en espera de entrega) o entregado.
  const isFinished = order.status !== 'pending' && order.status !== 'preparing';
  const waitTime = formatWaitTime(order.createdAt);
  const waitMinutes = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
  const badgeStatus = getTimeBadgeStatus(waitMinutes);

  // Determine card border color based on urgency (los tickets finalizados usan color fijo)
  const borderColor = isFinished
    ? order.status === 'ready'
      ? 'border-l-emerald-500'
      : 'border-l-gray-400'
    : waitMinutes >= 15 
      ? 'border-l-red-500' 
      : waitMinutes >= 10 
        ? 'border-l-yellow-500' 
        : 'border-l-green-500';

  return (
    <Card className={cn('border-l-4 p-4', borderColor)}>
      {/* Header: Order number + Time badge (solo tickets en cola) */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl font-bold">{formatOrderNumber(order.orderNumber)}</span>
        </div>
        {isFinished ? (
          <span className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            🏁 Finalizado
          </span>
        ) : (
          <StatusBadge status={badgeStatus} className="rounded-md px-3">
            🕐 {waitTime}
          </StatusBadge>
        )}
      </div>

      {/* Order type + estado real (pendiente / en preparación / lista / entregada) */}
      <div className="mt-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span>{getOrderTypeIcon(order.type)}</span>
          <span>{getOrderTypeLabel(order.type, order.tableNumber)}</span>
        </span>
        <Badge
          variant="outline"
          className={cn(
            'px-2 py-0.5 text-[10px] uppercase font-medium',
            ORDER_STATUS_BADGE_CLASSES[order.status],
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {/* Order items */}
      <div className="mt-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{item.quantity}x</span>
            <span>{item.productName}</span>
          </div>
        ))}
      </div>

      {/* Notas del pedido: al final, justo antes de marcar el ticket */}
      {order.notes && (
        <p className="mt-4 flex items-start gap-1.5 rounded-md border border-dashed bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-3">{order.notes}</span>
        </p>
      )}

      {/* Mark ready button (solo aplica a tickets aún en cola) */}
      {!isFinished && (
        <Button
          className="mt-4 w-full gap-2"
          variant="outline"
          disabled={updating}
          onClick={() => onMarkReady?.(order.id)}
        >
          <CheckCircle className="h-4 w-4" />
          {updating ? 'Actualizando…' : 'Marcar Listo'}
        </Button>
      )}
    </Card>
  );
}
