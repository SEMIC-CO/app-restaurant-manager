import { CheckCircle } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import type { Order, OrderType } from '@/types';

interface TicketCardProps {
  order: Order;
  onMarkReady?: (orderId: string) => void;
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
    case 'dine-in': return '🍽️';
    case 'takeout': return '🛍️';
    case 'delivery': return '🚗';
    default: return '📦';
  }
}

function getOrderTypeLabel(type: OrderType, tableNumber?: number): string {
  switch (type) {
    case 'dine-in': return tableNumber ? `Mesa ${tableNumber}` : 'Mesa';
    case 'takeout': return 'Para Llevar';
    case 'delivery': return 'Delivery';
    default: return '';
  }
}

/**
 * Ticket card for kitchen display showing order items and wait time
 */
export function TicketCard({ order, onMarkReady }: TicketCardProps) {
  const waitTime = formatWaitTime(order.createdAt);
  const waitMinutes = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
  const badgeStatus = getTimeBadgeStatus(waitMinutes);

  // Determine card border color based on urgency
  const borderColor = waitMinutes >= 15 
    ? 'border-l-red-500' 
    : waitMinutes >= 10 
      ? 'border-l-yellow-500' 
      : 'border-l-green-500';

  return (
    <Card className={cn('border-l-4 p-4', borderColor)}>
      {/* Header: Order number + Time badge */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xl font-bold">#{order.orderNumber.replace('ORD-', '')}</span>
        </div>
        <StatusBadge status={badgeStatus}>
          🕐 {waitTime}
        </StatusBadge>
      </div>

      {/* Order type */}
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span>{getOrderTypeIcon(order.type)}</span>
        <span>{getOrderTypeLabel(order.type, order.tableNumber)}</span>
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

      {/* Mark ready button */}
      <Button 
        className="mt-4 w-full gap-2" 
        variant="outline"
        onClick={() => onMarkReady?.(order.id)}
      >
        <CheckCircle className="h-4 w-4" />
        Marcar Listo
      </Button>
    </Card>
  );
}
