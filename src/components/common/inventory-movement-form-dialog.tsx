import * as React from 'react';
import { Controller, useWatch, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MoneyInput,
} from '@/components/ui';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import type {
  ApiInventoryItem,
  InventoryMovementType,
} from '@/types';
import {
  INVENTORY_MOVEMENT_LABELS,
  INVENTORY_MOVEMENT_OPTIONS,
  addsStock,
} from './inventory-labels';

const inventoryMovementSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Selecciona un artículo'),
    movementType: z.enum([
      'ENTRY',
      'EXIT',
      'ADJUSTMENT_IN',
      'ADJUSTMENT_OUT',
    ] satisfies readonly InventoryMovementType[]),
    /** Siempre positiva (check de la BD): el sentido lo da el tipo. */
    quantity: z
      .number('Ingresa la cantidad')
      .positive('La cantidad debe ser mayor a 0'),
    /**
     * Costo TOTAL del lote (entrada): el backend deriva de aquí el costo
     * unitario. Es lo que permite registrar una canasta de30 a $30.000.
     */
    totalCost: z
      .number('El costo debe ser un número')
      .min(0, 'El costo no puede ser negativo')
      .optional(),
    /** Precio de venta unitario registrado en las salidas. */
    unitPrice: z
      .number('El precio de venta debe ser un número')
      .min(0, 'El precio de venta no puede ser negativo')
      .optional(),
    reference: z.string().trim().max(100, 'La referencia no puede superar los 100 caracteres'),
    reason: z.string().trim().max(255, 'El motivo no puede superar los 255 caracteres'),
  })
  .refine(
    (data) =>
      data.movementType !== 'ENTRY' ||
      (data.totalCost !== undefined && data.totalCost > 0),
    {
      message: 'La entrada necesita el costo total del lote',
      path: ['totalCost'],
    },
  );

export type InventoryMovementFormData = z.infer<typeof inventoryMovementSchema>;

/**
 * Datos ya convertidos para enviar al servicio: `inventoryItemId` pasa de
 * string (select) a `number`.
 */
export type InventoryMovementFormSubmit = Omit<
  InventoryMovementFormData,
  'inventoryItemId'
> & { inventoryItemId: number };

/**
 * Movimiento que se está corrigiendo. La corrección **anula el original** y
 * registra este con el mismo artículo y tipo (la cantidad/costo se ajustan a lo
 * correcto), de modo que el dato erróneo deja de contar para el stock y para el
 * costo vigente.
 */
export interface InventoryMovementCorrection {
  movementId: number;
  inventoryItemId: number;
  /** Tipo original: la corrección se registra con el mismo tipo. */
  movementType: InventoryMovementType;
  quantity: number;
  reference: string | null;
  /** Costo unitario registrado, para precargar el total del lote. */
  unitCost: number | null;
  /** Precio de venta registrado (solo salidas). */
  unitPrice: number | null;
}

interface InventoryMovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Artículos para el selector (con su stock actual de la sede). */
  items: ApiInventoryItem[];
  onSubmit: (data: InventoryMovementFormSubmit) => Promise<void>;
  /** Modo corrección (`null`/omitido = registro normal). */
  correction?: InventoryMovementCorrection | null;
}

/** Mapea datos válidos del formulario al payload del servicio. */
function toSubmit(data: InventoryMovementFormData): InventoryMovementFormSubmit {
  return {
    ...data,
    inventoryItemId: Number(data.inventoryItemId),
    reference: data.reference.trim(),
    reason: data.reason.trim(),
  };
}

/**
 * Stock que resultaría de un movimiento. En modo corrección el original se
 * **anula** antes de registrar este, así que su efecto sale del cálculo: el
 * punto de partida es el stock actual más lo que devuelve esa anulación.
 */
function resolveStock(
  item: ApiInventoryItem | undefined,
  type: InventoryMovementType,
  quantity: number,
  correction: InventoryMovementCorrection | null | undefined,
): { base: number | null; result: number | null } {
  if (!item?.trackInventory || quantity <= 0) {
    return { base: null, result: null };
  }
  const current = item.currentStock ?? 0;
  const base = correction
    ? current +
      (addsStock(correction.movementType)
        ? -correction.quantity
        : correction.quantity)
    : current;
  return { base, result: base + (addsStock(type) ? quantity : -quantity) };
}

/**
 * Registro de un movimiento de inventario (entrada, salida o ajuste).
 *
 * Dos salvaguardas contra datos mal digitados:
 * 1. muestra el **stock resultante** en vivo y bloquea el envío si dejaría el
 *    stock en negativo (el backend lo rechazaría igual con `409`);
 * 2. pide una **confirmación con el resumen** antes de mandar nada.
 *
 * En modo corrección precarga el movimiento original, explica que se anulará y
 * registra este como su corrección (quien ejecuta ambas acciones es el padre).
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function InventoryMovementFormDialog({
  open,
  onOpenChange,
  items,
  onSubmit,
  correction,
}: InventoryMovementFormDialogProps) {
  const [step, setStep] = React.useState<'form' | 'confirm'>('form');
  const [validated, setValidated] =
    React.useState<InventoryMovementFormData | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InventoryMovementFormData>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: {
      inventoryItemId: '',
      movementType: 'ENTRY',
      quantity: 1,
      totalCost: undefined,
      unitPrice: undefined,
      reference: '',
      reason: '',
    },
  });

  React.useEffect(() => {
    if (!open) return;
    setStep('form');
    setValidated(null);
    setConfirming(false);
    reset(
      correction
        ? {
            inventoryItemId: String(correction.inventoryItemId),
            movementType: correction.movementType,
            quantity: correction.quantity,
            // El total que se había registrado: el nuevo se recalcula sobre
            // la cantidad corregida (unitCost × cantidad).
            totalCost:
              correction.unitCost !== null && correction.quantity > 0
                ? Number(
                    (correction.unitCost * correction.quantity).toFixed(2),
                  )
                : undefined,
            unitPrice: correction.unitPrice ?? undefined,
            reference: correction.reference ?? '',
            reason: `Corrección del movimiento #${correction.movementId}`,
          }
        : {
            inventoryItemId: '',
            movementType: 'ENTRY',
            quantity: 1,
            totalCost: undefined,
            unitPrice: undefined,
            reference: '',
            reason: '',
          },
    );
  }, [open, reset, correction]);

  const selectedItemId = useWatch({ control, name: 'inventoryItemId' });
  const movementType = useWatch({ control, name: 'movementType' });
  const quantity = useWatch({ control, name: 'quantity' }) || 0;
  const totalCost = useWatch({ control, name: 'totalCost' });
  const selectedItem = items.find(
    (item) => String(item.id) === selectedItemId,
  );
  const isExit =
    movementType === 'EXIT' || movementType === 'ADJUSTMENT_OUT';
  const isEntry = movementType === 'ENTRY';

  /** Costo unitario resultante (total ÷ cantidad) para mostrarlo en vivo. */
  const derivedUnitCost =
    totalCost !== undefined && totalCost > 0 && quantity > 0
      ? Number((totalCost / quantity).toFixed(2))
      : undefined;

  // ===== Stock resultante (evita mandar lo que el backend rechazará) =====
  const rawStock =
    selectedItem?.trackInventory && quantity > 0
      ? (selectedItem.currentStock ?? 0)
      : null;
  const { base: baseStock, result: resultingStock } = resolveStock(
    selectedItem,
    movementType,
    quantity,
    correction,
  );
  const stockError =
    resultingStock !== null && resultingStock < 0
      ? `No alcanza: el stock no puede quedar en ${resultingStock}. Ajusta la cantidad.`
      : null;

  /** Paso 1 → pasa al resumen si todo cuadra. */
  const handleFormSubmit = async (data: InventoryMovementFormData) => {
    if (stockError) return;
    setValidated(data);
    setStep('confirm');
  };

  /** Paso 2 → registra. Si `onSubmit` lanza, el diálogo sigue abierto. */
  const handleConfirm = async () => {
    if (!validated) return;
    setConfirming(true);
    try {
      await onSubmit(toSubmit(validated));
      onOpenChange(false);
    } catch (error) {
      console.error('Error registrando movimiento:', error);
    } finally {
      setConfirming(false);
    }
  };

  const summaryItem = items.find(
    (item) => String(item.id) === validated?.inventoryItemId,
  );
  const summaryQuantity = validated?.quantity ?? 0;
  const summarySubtracts =
    validated?.movementType === 'EXIT' ||
    validated?.movementType === 'ADJUSTMENT_OUT';
  const summaryRawStock = summaryItem?.trackInventory
    ? (summaryItem.currentStock ?? 0)
    : null;
  const { base: summaryBaseStock, result: summaryResultingStock } = validated
    ? resolveStock(
        summaryItem,
        validated.movementType,
        summaryQuantity,
        correction,
      )
    : { base: null, result: null };

  const dialogTitle = correction
    ? `Corregir movimiento #${correction.movementId}`
    : step === 'confirm'
      ? 'Confirmar movimiento'
      : 'Registrar Movimiento';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {step === 'confirm'
              ? 'Revisa el resumen: al confirmar, el stock cambia de inmediato.'
              : 'La entrada y el ajuste positivo suman stock; la salida y el ajuste negativo lo restan'}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && validated ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Artículo</span>
                <span className="text-right font-medium">
                  {summaryItem?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Tipo</span>
                <span className="text-right font-medium">
                  {INVENTORY_MOVEMENT_LABELS[validated.movementType]}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cantidad</span>
                <span className="text-right font-medium tabular-nums">
                  {summarySubtracts ? '−' : '+'}
                  {summaryQuantity}
                </span>
              </div>
              {summaryResultingStock !== null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {correction ? 'Stock tras corregir' : 'Stock resultante'}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {correction && summaryBaseStock !== null
                      ? `${summaryRawStock} → ${summaryBaseStock} → `
                      : `${summaryRawStock} → `}
                    {summaryResultingStock} {summaryItem?.unitOfMeasure}
                  </span>
                </div>
              )}
              {validated.movementType === 'ENTRY' &&
                validated.totalCost !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Costo total del lote
                    </span>
                    <span className="text-right font-medium">
                      {formatCurrency(validated.totalCost)}
                      {summaryQuantity > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          ({formatCurrency(validated.totalCost / summaryQuantity)}/u)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              {(validated.movementType === 'EXIT' ||
                validated.movementType === 'ADJUSTMENT_OUT') &&
                validated.unitPrice !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Precio de venta unitario
                    </span>
                    <span className="text-right font-medium">
                      {formatCurrency(validated.unitPrice)}
                    </span>
                  </div>
                )}
              {validated.reference && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="text-right font-medium">
                    {validated.reference}
                  </span>
                </div>
              )}
              {validated.reason && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Motivo</span>
                  <span className="text-right font-medium">
                    {validated.reason}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {correction
                ? `Se anula el movimiento #${correction.movementId} y se registra este como su reemplazo: nada se borra, el original queda marcado y deja de contar.`
                : 'Este movimiento entra al kardex y no se puede editar ni borrar: si queda mal digitado, se corrige con «Corregir» o se anula.'}
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                disabled={confirming}
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={confirming}
              >
                {confirming
                  ? 'Registrando...'
                  : correction
                    ? 'Anular y registrar'
                    : 'Confirmar'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Artículo *</Label>
              {correction ? (
                // Bloqueado: corregir un movimiento de otro artículo no tiene
                // sentido y dejaría el kardex sin cuadrar.
                <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                  {summaryItemName(items, correction.inventoryItemId)}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="inventoryItemId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un artículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name}
                            {item.code ? ` (${item.code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.inventoryItemId && (
                <p className="text-xs text-red-500">
                  {errors.inventoryItemId.message}
                </p>
              )}
              {selectedItem && (
                <p className="text-xs text-muted-foreground">
                  Stock actual:{' '}
                  <span className="font-medium text-foreground">
                    {selectedItem.trackInventory
                      ? `${selectedItem.currentStock ?? 0} ${selectedItem.unitOfMeasure}`
                      : 'sin control de stock'}
                  </span>
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de movimiento *</Label>
                {correction ? (
                  // Bloqueado: la corrección reemplaza al original con el
                  // mismo tipo (una entrada errónea se reemplaza por entrada).
                  <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm">
                    {INVENTORY_MOVEMENT_LABELS[correction.movementType]}
                  </div>
                ) : (
                  <Controller
                    control={control}
                    name="movementType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_MOVEMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory-movement-quantity">Cantidad *</Label>
                <Input
                  id="inventory-movement-quantity"
                  type="number"
                  min="0.0001"
                  step="any"
                  placeholder="10"
                  {...register('quantity', { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Stock resultante: el motivo más común de un error de digitación
                es quedarse sin stock (o en negativo, que el backend rechaza). */}
            {resultingStock !== null && (
              <p
                className={cn(
                  'text-xs',
                  stockError ? 'text-red-500' : 'text-muted-foreground',
                )}
              >
                {stockError ??
                  (correction ? (
                    <>
                      Stock actual{' '}
                      <span className="font-medium text-foreground">
                        {rawStock} {selectedItem?.unitOfMeasure}
                      </span>
                      {' → al anular el #'}
                      {correction.movementId}:{' '}
                      <span className="font-medium text-foreground">
                        {baseStock} {selectedItem?.unitOfMeasure}
                      </span>
                      {' → quedará en '}
                      <span className="font-medium text-foreground">
                        {resultingStock} {selectedItem?.unitOfMeasure}
                      </span>
                    </>
                  ) : (
                    <>
                      Stock actual{' '}
                      <span className="font-medium text-foreground">
                        {rawStock} {selectedItem?.unitOfMeasure}
                      </span>
                      {' → quedará en '}
                      <span className="font-medium text-foreground">
                        {resultingStock} {selectedItem?.unitOfMeasure}
                      </span>
                    </>
                  ))}
              </p>
            )}

            {correction && (
              <p className="text-xs text-muted-foreground">
                Corrección del movimiento #{correction.movementId}: al
                confirmar se{' '}
                <span className="font-medium text-foreground">
                  anula ese movimiento
                </span>{' '}
                —queda en el historial con el motivo, pero deja de contar— y se
                registra{' '}
                <span className="font-medium text-foreground">
                  {INVENTORY_MOVEMENT_LABELS[correction.movementType]} nueva
                </span>{' '}
                como su reemplazo con los datos correctos. Por eso sirve
                también para arreglar el costo vigente de una entrada.
              </p>
            )}

            {/* El costo se informa como TOTAL del lote: es lo que permite
                registrar una canasta de30 a $30.000 sin sacar la cuenta. */}
            {isExit ? (
              <div className="space-y-2">
                <Label htmlFor="inventory-movement-unit-price">
                  Precio de venta unitario (opcional)
                </Label>
                <Controller
                  control={control}
                  name="unitPrice"
                  render={({ field }) => (
                    <MoneyInput
                      id="inventory-movement-unit-price"
                      placeholder="0.00"
                      value={field.value ?? 0}
                      onValueChange={(value) =>
                        field.onChange(Number.isNaN(value) ? undefined : value)
                      }
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Es el precio por el que salió el producto: queda registrado en
                  la salida para saber cuánto se cobró. No toca el costo del
                  artículo.
                </p>
                {errors.unitPrice && (
                  <p className="text-xs text-red-500">
                    {errors.unitPrice.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="inventory-movement-total-cost">
                  Costo total del lote {isEntry ? '*' : '(opcional)'}
                </Label>
                <Controller
                  control={control}
                  name="totalCost"
                  render={({ field }) => (
                    <MoneyInput
                      id="inventory-movement-total-cost"
                      placeholder="0.00"
                      value={field.value ?? 0}
                      onValueChange={(value) =>
                        field.onChange(Number.isNaN(value) ? undefined : value)
                      }
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {derivedUnitCost !== undefined ? (
                    <>
                      Costo unitario:{' '}
                      <span className="font-medium text-foreground">
                        {formatCurrency(derivedUnitCost)}
                      </span>{' '}
                      (total ÷ cantidad)
                    </>
                  ) : isEntry ? (
                    'Lo que costó el lote completo. En una canasta de30 gaseosas a $30.000 va el total, no el unitario.'
                  ) : (
                    'Opcional: si lo dejas vacío, el conteo a favor mantiene el costo vigente del artículo.'
                  )}
                </p>
                {errors.totalCost && (
                  <p className="text-xs text-red-500">
                    {errors.totalCost.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inventory-movement-reference">
                Referencia (opcional)
              </Label>
              <Input
                id="inventory-movement-reference"
                placeholder="OC-1024, factura, remisión..."
                {...register('reference')}
              />
              {errors.reference && (
                <p className="text-xs text-red-500">
                  {errors.reference.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory-movement-reason">Motivo (opcional)</Label>
              <Textarea
                id="inventory-movement-reason"
                placeholder={
                  isExit
                    ? 'Consumo de cocina, merma, deterioro...'
                    : 'Recepción de bodega, conteo a favor...'
                }
                rows={2}
                {...register('reason')}
              />
              {errors.reason && (
                <p className="text-xs text-red-500">{errors.reason.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Revisar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Nombre del artículo bloqueado en modo corrección. */
function summaryItemName(items: ApiInventoryItem[], itemId: number): string {
  const item = items.find((candidate) => candidate.id === itemId);
  return item ? `${item.name}${item.code ? ` (${item.code})` : ''}` : `#${itemId}`;
}
