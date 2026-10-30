import { useState } from 'react';
import { Ban, BedDouble, ClipboardList, MapPin, Phone, X } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { OrderItemRow } from './order-item-row';
import { TablePickerDialog } from './table-picker-dialog';
import { ORDER_TYPE_LABELS, ORDER_TYPE_OPTIONS } from './order-labels';
import { formatCurrency } from '@/utils';
import type { FloorTable, OrderItem, OrderType, Section } from '@/types';

interface OrderCreateSidebarProps {
  /** Título del panel ("Nuevo Pedido" / "Editar Pedido"). */
  title?: string;
  /** Texto del botón principal ("Crear Pedido" / "Guardar Cambios"). */
  submitLabel?: string;
  /** Muestra el botón "Cancelar pedido" (solo en modo edición). */
  onCancelOrder?: () => void;
  cancelling?: boolean;
  orderType: OrderType;
  onOrderTypeChange: (orderType: OrderType) => void;
  customerName: string;
  onCustomerNameChange: (customerName: string) => void;
  /** Entrega a domicilio: dirección y teléfono (visibles solo con ese tipo). */
  address: string;
  onAddressChange: (address: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (customerPhone: string) => void;
  /** Notas libres del pedido (textarea). */
  notes: string;
  onNotesChange: (notes: string) => void;
  selectedTableId: number | null;
  onTableChange: (tableId: number | null) => void;
  /** Mesas ACTIVO de la sede (con sección y estado ocupada/libre). */
  tables: FloorTable[];
  /** Secciones reales (filtro del popup de mesas). */
  sections: Section[];
  /** ¿Siguen cargando las mesas? */
  tablesLoading?: boolean;
  /** Productos agregados al pedido (carrito). */
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

/**
 * Panel lateral de Pedidos: formulario del pedido (TIPO primero, mesa,
 * cliente, domicilio y notas) + carrito de productos + total. Un único botón:
 * "Crear Pedido".
 *
 * La mesa se elige con un **tag-botoncito** que abre un popup con las mesas
 * **libres** (cards compactas + filtro de secciones, como la vista de Mesas).
 */
export function OrderCreateSidebar({
  title,
  submitLabel,
  onCancelOrder,
  cancelling = false,
  orderType,
  onOrderTypeChange,
  customerName,
  onCustomerNameChange,
  address,
  onAddressChange,
  customerPhone,
  onCustomerPhoneChange,
  notes,
  onNotesChange,
  selectedTableId,
  onTableChange,
  tables,
  sections,
  tablesLoading = false,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
  submitting = false,
}: OrderCreateSidebarProps) {
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const isEmpty = items.length === 0;
  const tableRequired = orderType === 'mesa';
  const selectedTable =
    tables.find((table) => table.id === selectedTableId) ?? null;
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Elegir mesa = pedido de mesa (igual que al entrar desde la vista de Mesas)
  const handleSelectTable = (table: FloorTable) => {
    onTableChange(table.id);
    if (orderType !== 'mesa') onOrderTypeChange('mesa');
    setTablePickerOpen(false);
  };

  // La mesa solo aplica a pedidos de mesa: al cambiar de tipo se limpia la selección.
  const handleOrderTypeChange = (value: OrderType) => {
    onOrderTypeChange(value);
    if (value !== 'mesa' && selectedTableId !== null) onTableChange(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Datos del pedido */}
      <div className="shrink-0 space-y-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">{title ?? 'Nuevo Pedido'}</h2>
        </div>

        {/* Tipo de pedido (PRIMERO) */}
        <div className="space-y-1.5">
          <Label htmlFor="order-type">Tipo de pedido</Label>
          <Select value={orderType} onValueChange={handleOrderTypeChange}>
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

        {/* Mesa (DESPUÉS): tag con popup de mesas libres; solo con tipo "Mesa" */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5" />
            Mesa
            {tableRequired && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTablePickerOpen(true)}
              disabled={!tableRequired}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                selectedTable
                  ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
                  : 'border-dashed text-muted-foreground hover:border-primary/40 hover:text-foreground',
                !tableRequired &&
                  'cursor-not-allowed opacity-50 hover:border-dashed hover:text-muted-foreground',
              )}
            >
              <BedDouble className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">
                {selectedTable
                  ? `${selectedTable.name} · ${selectedTable.sectionName}`
                  : 'Seleccionar mesa libre'}
              </span>
              {tableRequired && (
                <span className="ml-auto shrink-0 text-xs underline-offset-2 hover:underline">
                  {selectedTable ? 'Cambiar' : 'Elegir'}
                </span>
              )}
            </button>
            {selectedTable && tableRequired && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Quitar mesa"
                onClick={() => onTableChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!tableRequired && (
            <p className="text-xs text-muted-foreground">
              Disponible solo para pedidos de tipo Mesa.
            </p>
          )}
          {tableRequired && tables.length === 0 && !tablesLoading && (
            <p className="text-xs text-muted-foreground">
              No hay mesas registradas en la sede.
            </p>
          )}
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

        {/* Entrega a domicilio: dirección y teléfono (opcionales) */}
        {orderType === 'domicilio' && (
          <div className="space-y-3 rounded-md border border-dashed p-3">
            <div className="space-y-1.5">
              <Label htmlFor="order-address" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Dirección
                <span className="text-xs font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="order-address"
                placeholder="Calle 10 #20-30, barrio"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Teléfono
                <span className="text-xs font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input
                id="order-phone"
                type="tel"
                placeholder="300 123 4567"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        )}

        {/* Notas del pedido */}
        <div className="space-y-1.5">
          <Label htmlFor="order-notes">Notas (opcional)</Label>
          <Textarea
            id="order-notes"
            rows={2}
            placeholder="Sin cebolla, extra limón, alergias, indicaciones…"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="resize-none text-sm"
          />
        </div>
      </div>

      {/* Popup: mesas libres con cards compactas y filtro de secciones */}
      <TablePickerDialog
        open={tablePickerOpen}
        onOpenChange={setTablePickerOpen}
        tables={tables}
        sections={sections}
        loading={tablesLoading}
        onSelectTable={handleSelectTable}
      />

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
                dense
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

        <div className="space-y-2 px-4 pb-4">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={onSubmit}
            disabled={isEmpty || submitting}
          >
            {submitting ? 'Guardando…' : (submitLabel ?? 'Crear Pedido')}
          </Button>
          {onCancelOrder && (
            <Button
              variant="outline"
              className="w-full gap-1.5 text-destructive hover:border-destructive/40 hover:text-destructive"
              onClick={onCancelOrder}
              disabled={submitting || cancelling}
            >
              <Ban className="h-4 w-4" />
              {cancelling ? 'Cancelando…' : 'Cancelar pedido'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
