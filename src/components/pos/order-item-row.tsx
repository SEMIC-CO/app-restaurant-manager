import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { OrderItem } from '@/types';

interface OrderItemRowProps {
  item: OrderItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

/**
 * Single order item row with quantity controls
 */
export function OrderItemRow({ item, onUpdateQuantity, onRemove }: OrderItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      {/* Product thumbnail placeholder */}
      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg">
        🥟
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.productName}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(item.unitPrice)} c/u
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (item.quantity === 1) {
              onRemove(item.id);
            } else {
              onUpdateQuantity(item.id, item.quantity - 1);
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
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Subtotal */}
      <div className="w-16 text-right font-semibold">
        {formatCurrency(item.subtotal)}
      </div>
    </div>
  );
}
