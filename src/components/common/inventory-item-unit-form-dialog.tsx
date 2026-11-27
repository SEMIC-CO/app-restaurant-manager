import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui';
import type { ApiInventoryItemUnit, ApiMeasurementUnit } from '@/types';

const inventoryItemUnitSchema = z.object({
  /** Solo en creación: en edición la unidad de la fila no cambia. */
  measurementUnitId: z.string().min(1, 'Selecciona una unidad'),
  conversionFactor: z
    .number('Ingresa un número válido')
    .gt(0, 'El factor de conversión debe ser mayor a 0'),
  barcode: z
    .string()
    .trim()
    .max(100, 'El código de barras no puede superar los 100 caracteres'),
  isPurchaseUnit: z.boolean(),
  isDefault: z.boolean(),
});

export type InventoryItemUnitFormData = z.infer<
  typeof inventoryItemUnitSchema
>;

/**
 * Datos ya convertidos para enviar al servicio: `measurementUnitId` pasa de
 * string (select) a `number`. Solo se incluye en creación (el PUT no acepta
 * cambiar la unidad de una fila existente).
 */
export type InventoryItemUnitFormSubmit = Omit<
  InventoryItemUnitFormData,
  'measurementUnitId'
> & {
  measurementUnitId?: number;
};

interface InventoryItemUnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita la fila; si no, agrega una unidad nueva. */
  entity?: ApiInventoryItemUnit;
  /**
   * Unidades del catálogo disponibles para agregar (en edición se ignora;
   * en creación el panel excluye las que el artículo ya tiene).
   */
  unitOptions: ApiMeasurementUnit[];
  onSubmit: (data: InventoryItemUnitFormSubmit) => Promise<void>;
}

/**
 * Formulario de unidad por artículo (agregar/editar fila de
 * `inventory_item_units`): unidad (solo al agregar), factor de conversión,
 * código de barras y los switches de compra/por defecto.
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto
 * (mismo contrato que InventoryItemFormDialog, ver FORMS-GUIDE.md).
 */
export function InventoryItemUnitFormDialog({
  open,
  onOpenChange,
  entity,
  unitOptions,
  onSubmit,
}: InventoryItemUnitFormDialogProps) {
  const isEdit = Boolean(entity);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InventoryItemUnitFormData>({
    resolver: zodResolver(inventoryItemUnitSchema),
    defaultValues: {
      measurementUnitId: '',
      conversionFactor: 1,
      barcode: '',
      isPurchaseUnit: false,
      isDefault: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        measurementUnitId: entity
          ? String(entity.measurementUnitId)
          : '',
        conversionFactor: entity?.conversionFactor ?? 1,
        barcode: entity?.barcode ?? '',
        isPurchaseUnit: entity?.isPurchaseUnit ?? false,
        isDefault: entity?.isDefault ?? false,
      });
    } else {
      reset({
        measurementUnitId: '',
        conversionFactor: 1,
        barcode: '',
        isPurchaseUnit: false,
        isDefault: false,
      });
    }
  }, [open, entity, reset]);

  const handleFormSubmit = async (data: InventoryItemUnitFormData) => {
    try {
      await onSubmit({
        // En edición la unidad es fija: no se envía (el PUT no la acepta).
        measurementUnitId: isEdit ? undefined : Number(data.measurementUnitId),
        conversionFactor: data.conversionFactor,
        barcode: data.barcode.trim(),
        isPurchaseUnit: data.isPurchaseUnit,
        isDefault: data.isDefault,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando unidad del artículo:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>
            {entity ? 'Editar Unidad del Artículo' : 'Nueva Unidad del Artículo'}
          </DialogTitle>
          <DialogDescription>
            {entity
              ? 'Actualiza el factor de conversión y el código de barras'
              : 'Agrega una unidad de compra o presentación con su factor a la unidad base'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Unidad *</Label>
              <Controller
                control={control}
                name="measurementUnitId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.measurementUnitId && (
                <p className="text-xs text-red-500">
                  {errors.measurementUnitId.message}
                </p>
              )}
              {unitOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Este artículo ya tiene configuradas todas las unidades
                  disponibles del catálogo.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="item-unit-factor">Factor de conversión *</Label>
            <Input
              id="item-unit-factor"
              type="number"
              min={0}
              step="any"
              placeholder="12"
              {...register('conversionFactor', {
                valueAsNumber: true,
              })}
            />
            <p className="text-xs text-muted-foreground">
              Cuántas unidades base contiene una de esta unidad (p. ej. 1 caja =
              12 unidades → factor 12).
            </p>
            {errors.conversionFactor && (
              <p className="text-xs text-red-500">
                {errors.conversionFactor.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-unit-barcode">
              Código de barras (opcional)
            </Label>
            <Input
              id="item-unit-barcode"
              placeholder="7701234567890"
              maxLength={100}
              {...register('barcode')}
            />
            {errors.barcode && (
              <p className="text-xs text-red-500">{errors.barcode.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="item-unit-purchase" className="text-sm font-medium">
                Unidad de compra
              </Label>
              <p className="text-xs text-muted-foreground">
                En que sueles comprar este artículo al proveedor
              </p>
            </div>
            <Controller
              control={control}
              name="isPurchaseUnit"
              render={({ field }) => (
                <Switch
                  id="item-unit-purchase"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="item-unit-default" className="text-sm font-medium">
                Por defecto
              </Label>
              <p className="text-xs text-muted-foreground">
                Unidad sugerida al registrar movimientos
              </p>
            </div>
            <Controller
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Switch
                  id="item-unit-default"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : entity ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
