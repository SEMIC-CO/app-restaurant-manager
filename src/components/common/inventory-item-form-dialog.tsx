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
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { ApiInventoryCategory, ApiInventoryItem } from '@/types';
import { INVENTORY_UNITS } from './inventory-labels';

/** Sentinel de Radix Select para "sin categoría" (value no puede ser ''). */
const NO_CATEGORY = 'none';

const inventoryItemSchema = z.object({
  code: z
    .string()
    .trim()
    .max(100, 'El código no puede superar los 100 caracteres'),
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  description: z.string().trim(),
  inventoryCategoryId: z.string(),
  unitOfMeasure: z.string().min(1, 'Selecciona la unidad de medida'),
  trackInventory: z.boolean(),
  isActive: z.boolean(),
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

/**
 * Datos ya convertidos para enviar al servicio: `inventoryCategoryId` pasa de
 * string (select) a `number | undefined` (`undefined` = sin categoría).
 */
export type InventoryItemFormSubmit = Omit<
  InventoryItemFormData,
  'inventoryCategoryId'
> & { inventoryCategoryId?: number };

interface InventoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el artículo; si no, crea uno nuevo. */
  entity?: ApiInventoryItem;
  /** Categorías de la empresa para el selector. */
  categories: ApiInventoryCategory[];
  onSubmit: (data: InventoryItemFormSubmit) => Promise<void>;
}

/**
 * Formulario de artículo de inventario (crear/editar). El diálogo se cierra
 * solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function InventoryItemFormDialog({
  open,
  onOpenChange,
  entity,
  categories,
  onSubmit,
}: InventoryItemFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      inventoryCategoryId: '',
      unitOfMeasure: 'unit',
      trackInventory: true,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        code: entity?.code ?? '',
        name: entity?.name ?? '',
        description: entity?.description ?? '',
        inventoryCategoryId: entity?.inventoryCategoryId
          ? String(entity.inventoryCategoryId)
          : NO_CATEGORY,
        unitOfMeasure: entity?.unitOfMeasure ?? 'unit',
        trackInventory: entity?.trackInventory ?? true,
        isActive: entity?.isActive ?? true,
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        inventoryCategoryId: '',
        unitOfMeasure: 'unit',
        trackInventory: true,
        isActive: true,
      });
    }
  }, [open, entity, reset]);

  const handleFormSubmit = async (data: InventoryItemFormData) => {
    try {
      await onSubmit({
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        inventoryCategoryId:
          data.inventoryCategoryId === NO_CATEGORY
            ? undefined
            : Number(data.inventoryCategoryId),
        unitOfMeasure: data.unitOfMeasure,
        trackInventory: data.trackInventory,
        isActive: data.isActive,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando artículo de inventario:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{entity ? 'Editar Artículo' : 'Nuevo Artículo'}</DialogTitle>
          <DialogDescription>
            {entity
              ? 'Actualiza los datos del artículo de inventario'
              : 'Registra un artículo para controlar su stock por sede'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inventory-item-name">Nombre *</Label>
              <Input id="inventory-item-name" placeholder="Harina" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory-item-code">Código (opcional)</Label>
              <Input id="inventory-item-code" placeholder="HAR-01" {...register('code')} />
              <p className="text-xs text-muted-foreground">Debe ser único</p>
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Controller
                control={control}
                name="inventoryCategoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidad de medida *</Label>
              <Controller
                control={control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVENTORY_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unitOfMeasure && (
                <p className="text-xs text-red-500">
                  {errors.unitOfMeasure.message}
                </p>
              )}
            </div>
          </div>

          {/* El costo no se digita: lo calculan las entradas. El precio de
              venta vive en el producto, no en el artículo. */}
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-sm font-medium">Costo vigente</Label>
              <span className="text-lg font-semibold tabular-nums">
                {entity ? formatCurrency(entity.costPrice) : '—'}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {entity
                ? 'Se recalcula solo con cada entrada (promedio ponderado de lo comprado). El precio de venta se define en el producto, no aquí.'
                : 'Se calcula automáticamente al registrar las entradas de este artículo.'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="inventory-item-track" className="text-sm font-medium">
                Controlar stock
              </Label>
              <p className="text-xs text-muted-foreground">
                Sin control no se admiten movimientos del artículo
              </p>
            </div>
            <Controller
              control={control}
              name="trackInventory"
              render={({ field }) => (
                <Switch
                  id="inventory-item-track"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor="inventory-item-active" className="text-sm font-medium">
                Artículo activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Los inactivos no admiten nuevos movimientos
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="inventory-item-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory-item-description">
              Descripción (opcional)
            </Label>
            <Textarea
              id="inventory-item-description"
              placeholder="Harina de trigo para panadería"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
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
              {isSubmitting ? 'Guardando...' : entity ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
