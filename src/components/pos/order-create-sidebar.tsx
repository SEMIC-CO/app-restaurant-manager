import { BedDouble, ClipboardList } from 'lucide-react';
import { Button, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { OrderItemRow } from './order-item-row';
import { ORDER_TYPE_LABELS, ORDER_TYPE_OPTIONS } from './order-labels';
import { formatCurrency } from '@/utils';
import type { FloorTable, OrderItem, OrderType } from '@/types';

interface OrderCreateSidebarProps {
  orderType: OrderType;
  onOrderTypeChange: (orderType: OrderType) => void;
  customerName: string;
  onCustomerNameChange: (customerName: string) => void;
  selectedTableId: number | null;
  onTableChange: (tableId: number | null) => void;
  /** Mesas ACTIVO de la sede (con sección y estado ocupada/libre). */
  tables: FloorTable[];
  /** Productos agregados al pedido (carrito). */
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

/**
 * Panel lateral de Pedidos: formulario del pedido (tipo, cliente opcional,
 * mesa) + carrito de productos + total. Un único botón: "Crear Pedido".
 */
export function OrderCreateSidebar({
  orderType,
  onOrderTypeChange,
  customerName,
  onCustomerNameChange,
  selectedTableId,
  onTableChange,
  tables,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
  submitting = false,
}: OrderCreateSidebarProps) {
  const isEmpty = items.length === 0;
  const tableRequired = orderType === 'mesa';
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Datos del pedido */}
      <div className="shrink-0 space-y-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">Nuevo Pedido</h2>
        </div>

        {/* Tipo de orden */}
        <div className="space-y-1.5">
          <Label htmlFor="order-type">Tipo de pedido</Label>
          <Select value={orderType} onValueChange={(value) => onOrderTypeChange(value as OrderType)}>
            <SelectTrigger id="order-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {ORDER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente (opcional) */}
        <div className="space-y-1.5">
          <Label htmlFor="order-customer">Cliente (opcional)</Label>
          <Input
            id="order-customer"
            placeholder="Nombre del cliente"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Mesa */}
        <div className="space-y-1.5">
          <Label htmlFor="order-table" className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5" />
            Mesa
            {tableRequired && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={selectedTableId !== null ? String(selectedTableId) : 'none'}
            onValueChange={(value) => onTableChange(value === 'none' ? null : Number(value))}
          >
            <SelectTrigger id="order-table" className="w-full">
              <SelectValue placeholder="Selecciona una mesa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin mesa</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table.id} value={String(table.id)}>
                  {table.name} · {table.sectionName}
                  {table.floorStatus === 'occupied' ? ' (Ocupada)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tables.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay mesas registradas en la sede.
            </p>
          )}
        </div>
      </div>

      {/* Carrito del pedido */}
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
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Total + único botón de acción */}
      <div className="mt-auto shrink-0 border-t bg-card">
        <div className="space-y-1 px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Productos</span>
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={onSubmit}
            disabled={isEmpty || submitting}
          >
            {submitting ? 'Creando...' : 'Crear Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );
}
