import { Printer, Banknote, CreditCard, QrCode, Users, X, BedDouble as BedDoubleIcon } from 'lucide-react';
import { Button, Input, ScrollArea, Badge } from '@/components/ui';
import { OrderItemRow } from './order-item-row';
import { formatCurrency } from '@/utils';
import { useCartStore } from '@/store';
import type { PaymentMethod, Table, TableStatus } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTicketProps {
  orderNumber?: string;
  tableNumber?: number;
  /** Mesa completa con su info. Muestra un bloque contextual superior si existe. */
  table?: Table | null;
  onSave?: () => void;
  onCharge?: () => void;
  /** Si el usuario puede "des-asignar" la mesa del ticket actual (opcional). */
  onClearTable?: () => void;
}

const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'cash', label: 'EFECTIVO', icon: <Banknote className="h-5 w-5" /> },
  { method: 'card', label: 'TARJETA', icon: <CreditCard className="h-5 w-5" /> },
  { method: 'qr', label: 'QR', icon: <QrCode className="h-5 w-5" /> },
];

const TABLE_STATUS_LABEL: Record<TableStatus, { label: string; className: string }> = {
  available: { label: 'Libre', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  occupied: { label: 'Ocupada', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  reserved: { label: 'Reservada', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
};

/**
 * Order ticket sidebar showing cart items, totals, and payment options.
 *
 * Si recibe `table` muestra un bloque contextual en la cabecera con el detalle
 * de la mesa seleccionada (icono, categoría, capacidad, estado, cliente).
 */
export function OrderTicket({
  orderNumber = '#ORD-0000',
  tableNumber,
  table,
  onSave,
  onCharge,
  onClearTable,
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

  const displayTable = table ?? (tableNumber ? { number: tableNumber } as Partial<Table> : null);

  return (
    <div className="flex h-full flex-col">
      {/* Mesa asignada (detalle contextual) */}
      {displayTable && (
        <div className="flex items-start gap-3 border-b bg-primary/5 px-4 py-3">
          {displayTable.icon ? (
            <span className="text-3xl leading-none">{displayTable.icon}</span>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
              <BedDoubleIcon className="h-6 w-6" strokeWidth={2} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {displayTable.name ? displayTable.name : `Mesa ${displayTable.number}`}
              </h3>
              {displayTable.status && (
                <Badge
                  variant="outline"
                  className={cn('h-5 px-1.5 text-[10px] uppercase font-medium', TABLE_STATUS_LABEL[displayTable.status].className)}
                >
                  {TABLE_STATUS_LABEL[displayTable.status].label}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {displayTable.categoryId && (
                <span>
                  {displayTable.categoryId === 'principal'
                    ? 'Principal'
                    : displayTable.categoryId === 'terraza-bar'
                      ? 'Terraza Bar'
                      : displayTable.categoryId === 'segundo-piso'
                        ? '2do Piso'
                        : displayTable.categoryId}
                </span>
              )}
              {displayTable.capacity !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {displayTable.capacity}
                </span>
              )}
              {(table?.customerName || displayTable.orderNumber) && (
                <span className="truncate text-[11px]">
                  {table?.customerName ?? displayTable.orderNumber}
                </span>
              )}
            </div>
          </div>
          {onClearTable && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearTable} type="button">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Header ticket general */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-bold">Ticket de Pedido</h2>
          <p className="text-sm text-muted-foreground">
            {orderNumber}
            {!displayTable && tableNumber && ` • Mesa ${tableNumber}`}
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
