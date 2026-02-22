import { Printer, Banknote, CreditCard, QrCode } from 'lucide-react';
import { Button, Input, ScrollArea } from '@/components/ui';
import { OrderItemRow } from './order-item-row';
import { formatCurrency } from '@/utils';
import { useCartStore } from '@/store';
import type { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTicketProps {
  orderNumber?: string;
  tableNumber?: number;
  onSave?: () => void;
  onCharge?: () => void;
}

const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'cash', label: 'EFECTIVO', icon: <Banknote className="h-5 w-5" /> },
  { method: 'card', label: 'TARJETA', icon: <CreditCard className="h-5 w-5" /> },
  { method: 'qr', label: 'QR', icon: <QrCode className="h-5 w-5" /> },
];

/**
 * Order ticket sidebar showing cart items, totals, and payment options
 */
export function OrderTicket({ 
  orderNumber = '#ORD-0000', 
  tableNumber,
  onSave,
  onCharge,
}: OrderTicketProps) {
  const { 
    items, 
    customerName,
    paymentMethod,
    setCustomerName,
    setPaymentMethod,
    updateQuantity, 
    removeItem,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-bold">Ticket de Pedido</h2>
          <p className="text-sm text-muted-foreground">
            {orderNumber} {tableNumber && `• Mesa ${tableNumber}`}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer name input */}
      <div className="border-b px-4 py-3">
        <Input
          placeholder="Nombre del cliente (Opcional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Order items */}
      <ScrollArea className="flex-1 px-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl">🛒</span>
            <p className="mt-3 text-sm text-muted-foreground">
              El carrito está vacío
            </p>
            <p className="text-xs text-muted-foreground">
              Selecciona productos para agregar
            </p>
          </div>
        ) : (
          <div className="py-2">
            {items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals & Actions */}
      <div className="mt-auto border-t bg-card">
        {/* Totals */}
        <div className="space-y-2 px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Impuestos (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment method selection */}
        <div className="flex gap-2 border-t px-4 py-3">
          {paymentMethods.map(({ method, label, icon }) => (
            <Button
              key={method}
              variant={paymentMethod === method ? 'default' : 'outline'}
              onClick={() => setPaymentMethod(method)}
              className={cn(
                'flex-1 flex-col h-auto gap-1 py-3',
                paymentMethod === method && 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
              )}
            >
              {icon}
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onSave}
            disabled={isEmpty}
          >
            Guardar
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={onCharge}
            disabled={isEmpty}
          >
            Cobrar
            <span>→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
