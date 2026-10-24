import { BedDouble, Clock, Users, X } from 'lucide-react';
import { Badge, Button, ScrollArea } from '@/components/ui';
import {
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_BADGE_CLASSES,
  ORDER_TYPE_LABELS,
} from './order-labels';
import { formatCurrency } from '@/utils';
import type { Order } from '@/types';

interface OrderDetailPanelProps {
  order: Order;
  onClose?: () => void;
}

/**
 * Detalle de un pedido en la sección derecha de Pedidos:
 * cabecera con badges, datos generales, items y totales.
 */
export function OrderDetailPanel({ order, onClose }: OrderDetailPanelProps) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cabecera */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-bold">Detalle del pedido</h2>
          <p className="text-sm text-muted-foreground">#{order.orderNumber.replace('ORD-', '')}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Cerrar detalle">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Datos generales + items */}
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-4 py-3">
          <div className="flex flex-wrap gap-2">
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

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <BedDouble className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Mesa</p>
                <p className="truncate font-medium">{order.tableNumber ?? 'Sin mesa'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="truncate font-medium">{order.customerName ?? 'Sin cliente'}</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="truncate font-medium">
                  {new Date(order.createdAt).toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Productos</h3>
              <span className="text-xs text-muted-foreground">{units} unidad(es)</span>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.productName || `Producto ${item.productId}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} c/u × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Totales */}
      <div className="shrink-0 space-y-1 border-t bg-card px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
