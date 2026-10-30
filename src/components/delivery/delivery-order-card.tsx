import { CheckCircle, Clock } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { formatCurrency, formatOrderNumber, formatRelativeTime } from '@/utils';
import type { Order } from '@/types';

interface DeliveryOrderCardProps {
  order: Order;
  variant: 'ready' | 'pending-invoice';
  onDeliver?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  onGenerateInvoice?: (orderId: string) => void;
}

/**
 * Order card for delivery control showing customer info and actions
 */
export function DeliveryOrderCard({ 
  order, 
  variant,
  onDeliver,
  onViewDetails,
  onGenerateInvoice,
}: DeliveryOrderCardProps) {
  const timeAgo = formatRelativeTime(order.createdAt);

  return (
    <Card className="p-4">
      {/* Header: Order number + Status + Time */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatOrderNumber(order.orderNumber)}
          </span>
          {order.status === 'paid' && (
            <Badge variant="success" className="text-xs">Pagado</Badge>
          )}
          {order.status === 'delivered' && (
            <Badge variant="secondary" className="text-xs">Entregado</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Customer name */}
      {order.customerName && (
        <p className="mt-2 font-medium">{order.customerName}</p>
      )}

      {/* Order items summary */}
      <div className="mt-3 space-y-1">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {item.quantity}x {item.productName}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-sm text-muted-foreground">
            +{order.items.length - 3} más...
          </p>
        )}
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">
          {variant === 'ready' ? 'Total' : 'Total a Facturar'}
        </span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4">
        {variant === 'ready' ? (
          <Button 
            className="w-full gap-2"
            onClick={() => onDeliver?.(order.id)}
          >
            <CheckCircle className="h-4 w-4" />
            Entregar Pedido
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewDetails?.(order.id)}
            >
              Ver Detalles
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={() => onGenerateInvoice?.(order.id)}
            >
              <span>📄</span>
              Generar Factura
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
