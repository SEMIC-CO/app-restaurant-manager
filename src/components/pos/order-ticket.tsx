import { Printer, Banknote, CreditCard, QrCode, Users, X, BedDouble as BedDoubleIcon } from 'lucide-react';
import { Button, ScrollArea, Badge } from '@/components/ui';
import { OrderItemRow } from './order-item-row';
import { formatCurrency } from '@/utils';
import { useCartStore } from '@/store';
import type { PaymentMethod, FloorTable, FloorTableStatus } from '@/types';
import { cn } from '@/lib/utils';

interface OrderTicketProps {
  orderNumber?: string;
  /** Mesa completa con su info. Muestra un bloque contextual superior si existe. */
  table?: FloorTable | null;
  onSave?: () => void;
  onCharge?: () => void;
  /** Si el usuario puede "des-asignar" la mesa del ticket actual (opcional). */
  onClearTable?: () => void;
  /**
   * Limpia el ticket completo (mesa + pedido cargado). Se muestra como botón
   * en la cabecera cuando el ticket contiene un pedido cargado desde la caja.
   */
  onClearTicket?: () => void;
}

const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'cash', label: 'EFECTIVO', icon: <Banknote className="h-5 w-5" /> },
  { method: 'card', label: 'TARJETA', icon: <CreditCard className="h-5 w-5" /> },
  { method: 'qr', label: 'QR', icon: <QrCode className="h-5 w-5" /> },
];

const TABLE_STATUS_LABEL: Record<FloorTableStatus, { label: string; className: string }> = {
  available: { label: 'Libre', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  occupied: { label: 'Ocupada', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
};

/** Propina voluntaria: sin propina por defecto + los porcentajes ofrecidos. */
const TIP_OPTIONS: { rate: number; label: string }[] = [
  { rate: 0, label: 'Sin propina' },
  { rate: 0.05, label: '5%' },
  { rate: 0.1, label: '10%' },
];

/**
 * Order ticket sidebar showing cart items, totals, and payment options.
 *
 * Si recibe `table` muestra un bloque contextual en la cabecera con el detalle
 * de la mesa seleccionada (nombre, sección, capacidad, estado, cliente).
 */
export function OrderTicket({
  orderNumber = '#ORD-0000',
  table,
  onSave,
  onCharge,
  onClearTable,
  onClearTicket,
}: OrderTicketProps) {
  const {
    items,
    paymentMethod,
    loadedOrder,
    tipRate,
    setPaymentMethod,
    setTipRate,
    getSubtotal,
    getTax,
    getDiscount,
    getTip,
    getPayable,
  } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const discount = getDiscount();
  const tip = getTip();
  /** Total a cobrar: incluye la propina voluntaria. */
  const payable = getPayable();
  const isEmpty = items.length === 0;
  /** Ticket con un pedido real cargado: sus totales no llevan el IVA del ticket nuevo. */
  const isLoadedOrder = loadedOrder !== null;

  const displayTable = table;

  return (
    <div className="flex h-full flex-col">
      {/* Mesa asignada (detalle contextual) */}
      {displayTable && (
        <div className="flex items-start gap-3 border-b bg-primary/5 px-4 py-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <BedDoubleIcon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {displayTable.name}
              </h3>
              <Badge
                variant="outline"
                className={cn('h-5 px-1.5 text-[10px] uppercase font-medium', TABLE_STATUS_LABEL[displayTable.floorStatus].className)}
              >
                {TABLE_STATUS_LABEL[displayTable.floorStatus].label}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{displayTable.sectionName}</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {displayTable.cantPeople}
              </span>
              {(displayTable.customerName || displayTable.orderNumber) && (
                <span className="truncate text-[11px]">
                  {displayTable.customerName ?? displayTable.orderNumber}
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
          </p>
        </div>
        <div className="flex items-center gap-1">
          {onClearTicket && isLoadedOrder && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearTicket}
              type="button"
              aria-label="Limpiar ticket"
              title="Limpiar ticket"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Imprimir ticket">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Order items (min-h-0: permite que se encoja y totales/acciones siempre se vean) */}
      <ScrollArea className="min-h-0 flex-1 px-4">
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
                readOnly
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals & Actions */}
      <div className="mt-auto border-t bg-card">
        {/* Propina voluntaria */}
        <div className="space-y-2 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Propina</span>
            <span className="text-xs text-muted-foreground">Voluntaria</span>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Propina">
            {TIP_OPTIONS.map((option) => {
              const isActive = tipRate === option.rate;
              return (
                <label
                  key={option.rate}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <input
                    type="radio"
                    name="ticket-tip"
                    className="h-3.5 w-3.5 accent-primary"
                    checked={isActive}
                    onChange={() => setTipRate(option.rate)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {!isLoadedOrder && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          {/* Pedido real cargado: sin IVA propio, con su descuento del backend */}
          {isLoadedOrder && discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="text-destructive">−{formatCurrency(discount)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Propina ({Math.round(tipRate * 100)}%)
              </span>
              <span>{formatCurrency(tip)}</span>
            </div>
          )}
          {/* Total a cobrar = total (facturable) + propina voluntaria */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total a pagar</span>
            <span className="text-primary">{formatCurrency(payable)}</span>
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
