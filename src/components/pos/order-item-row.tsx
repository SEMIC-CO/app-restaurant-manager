import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils';
import type { OrderItem } from '@/types';

interface OrderItemRowProps {
  item: OrderItem;
  /** Ajusta la cantidad (Crear Pedido); no se usa en modo `readOnly`. */
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  /** Elimina el item cuando la cantidad es 1 (Crear Pedido); no se usa en `readOnly`. */
  onRemove?: (itemId: string) => void;
  /**
   * Solo lectura (banner de Caja): sin botones de +/-/eliminar y con la
   * tipografía un poco más pequeña. En Caja la edición vive en el
   * formulario de Cobrar.
   */
  readOnly?: boolean;
  /**
   * Tipografía un poco más pequeña (Pedidos/Crear Pedido) sin quitar los
   * controles de cantidad.
   */
  dense?: boolean;
}

/**
 * Fila de item del pedido: imagen (si la tiene), producto, cantidad y subtotal.
 */
export function OrderItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  readOnly = false,
  dense = false,
}: OrderItemRowProps) {
  /** Fila con letra pequeña: ticket de Caja (`readOnly`) o Pedidos (`dense`). */
  const small = readOnly || dense;

  return (
    <div className="flex items-center gap-3 py-3 pr-1 border-b last:border-b-0">
      {/* Miniatura real del producto (solo si tiene imagen; sin emoji de relleno) */}
      {item.productImage && (
        <img
          src={item.productImage}
          alt=""
          className="h-8 w-8 shrink-0 rounded-md object-cover"
        />
      )}

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'truncate font-medium text-foreground',
            small && 'text-sm',
          )}
        >
          {item.productName}
        </p>
        <p
          className={cn(
            'text-muted-foreground',
            small ? 'text-xs' : 'text-sm',
          )}
        >
          {formatCurrency(item.unitPrice)} c/u
        </p>
      </div>

      {readOnly ? (
        /* Caja: sin controles de cantidad; la edición vive en Cobrar */
        <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          ×{item.quantity}
        </span>
      ) : (
        /* Quantity controls */
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (item.quantity === 1) {
                onRemove?.(item.id);
              } else {
                onUpdateQuantity?.(item.id, item.quantity - 1);
              }
            }}
          >
            {item.quantity === 1 ? (
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
          </Button>
          <span className="w-6 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Subtotal: ancho mínimo y sin envoltura para que no se salga por la derecha */}
      <div
        className={cn(
          'min-w-[5.5rem] shrink-0 whitespace-nowrap text-right font-semibold tabular-nums',
          small && 'text-sm',
        )}
      >
        {formatCurrency(item.subtotal)}
      </div>
    </div>
  );
}
