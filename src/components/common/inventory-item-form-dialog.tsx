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
import type {
  ApiInventoryCategory,
  ApiInventoryItem,
  ApiMeasurementUnit,
} from '@/types';

/** Sentinel de Radix Select para "sin categoría" (value no puede ser ''). */
const NO_CATEGORY = 'none';

const inventoryItemSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(150, 'El nombre no puede superar los 150 caracteres'),
    description: z.string().trim(),
    inventoryCategoryId: z.string(),
    baseUnitId: z.string().min(1, 'Selecciona la unidad base'),
    barcode: z
      .string()
      .trim()
      .max(100, 'El código de barras no puede superar los 100 caracteres'),
    minimumStock: z
      .number('Ingresa un número válido')
      .min(0, 'El stock mínimo debe ser mayor o igual a 0'),
    maximumStock: z
      .number('Ingresa un número válido')
      .min(0, 'El stock máximo debe ser mayor o igual a 0')
      .nullable(),
    allowMenuConfig: z.boolean(),
    trackInventory: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.maximumStock !== null && data.maximumStock < data.minimumStock) {
      ctx.addIssue({
        code: 'custom',
        path: ['maximumStock'],
        message: 'El stock máximo debe ser mayor o igual al mínimo',
      });
    }
  });

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

/**
 * Datos ya convertidos para enviar al servicio: `inventoryCategoryId` pasa de
 * string (select) a `number | undefined` (`undefined` = sin categoría) y
 * `baseUnitId` de string a `number`. `maximumStock: null` borra el tope en
 * update. El `code` no viaja: lo genera el backend al crear.
 */
export type InventoryItemFormSubmit = Omit<
  InventoryItemFormData,
  'inventoryCategoryId' | 'baseUnitId'
> & {
  inventoryCategoryId?: number;
  baseUnitId: number;
};

interface InventoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el artículo; si no, crea uno nuevo. */
  entity?: ApiInventoryItem;
  /** Categorías de la empresa para el selector. */
  categories: ApiInventoryCategory[];
  /** Catálogo de unidades de medida (el select ofrece solo las activas). */
  measurementUnits: ApiMeasurementUnit[];
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
  measurementUnits,
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
      name: '',
      description: '',
      inventoryCategoryId: '',
      baseUnitId: '',
      barcode: '',
      minimumStock: 0,
      maximumStock: null,
      allowMenuConfig: false,
      trackInventory: true,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: entity?.name ?? '',
        description: entity?.description ?? '',
        inventoryCategoryId: entity?.inventoryCategoryId
          ? String(entity.inventoryCategoryId)
          : NO_CATEGORY,
        baseUnitId: entity?.baseUnitId != null ? String(entity.baseUnitId) : '',
        barcode: entity?.barcode ?? '',
        minimumStock: entity?.minimumStock ?? 0,
        maximumStock: entity?.maximumStock ?? null,
        allowMenuConfig: entity?.allowMenuConfig ?? false,
        trackInventory: entity?.trackInventory ?? true,
        isActive: entity?.isActive ?? true,
      });
    } else {
      reset({
        name: '',
        description: '',
        inventoryCategoryId: '',
        baseUnitId: '',
        barcode: '',
        minimumStock: 0,
        maximumStock: null,
        allowMenuConfig: false,
        trackInventory: true,
        isActive: true,
      });
    }
  }, [open, entity, reset]);

  const handleFormSubmit = async (data: InventoryItemFormData) => {
    try {
      await onSubmit({
        // Sin `code`: el backend lo genera al crear (BEB-COC-001, …) y en la
        // edición lo conserva (no se envía, el update es parcial).
        name: data.name.trim(),
        description: data.description.trim(),
        inventoryCategoryId:
          data.inventoryCategoryId === NO_CATEGORY
            ? undefined
            : Number(data.inventoryCategoryId),
        baseUnitId: Number(data.baseUnitId),
        barcode: data.barcode.trim(),
        minimumStock: data.minimumStock,
        maximumStock: data.maximumStock,
        allowMenuConfig: data.allowMenuConfig,
        trackInventory: data.trackInventory,
        isActive: data.isActive,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando artículo de inventario:', error);
    }
  };

  const activeUnits = measurementUnits.filter((unit) => unit.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto overscroll-contain">
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

            {/* El código ya no se pide: lo genera el backend al crear. */}
            <div className="space-y-2">
              <Label htmlFor="inventory-item-barcode">
                Código de barras (opcional)
              </Label>
              <Input
                id="inventory-item-barcode"
                placeholder="7701234567890"
                maxLength={100}
                {...register('barcode')}
              />
              {errors.barcode && (
                <p className="text-xs text-red-500">{errors.barcode.message}</p>
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
              <Label>Unidad base *</Label>
              <Controller
                control={control}
                name="baseUnitId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona la unidad base" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeUnits.map((unit) => (
                        <SelectItem key={unit.id} value={String(unit.id)}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.baseUnitId && (
                <p className="text-xs text-red-500">{errors.baseUnitId.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inventory-item-minimum-stock">Stock mínimo</Label>
              <Input
                id="inventory-item-minimum-stock"
                type="number"
                min={0}
                step="any"
                placeholder="0"
                {...register('minimumStock', {
                  setValueAs: (value) =>
                    value === '' || value === null ? 0 : Number(value),
                })}
              />
              {errors.minimumStock && (
                <p className="text-xs text-red-500">
                  {errors.minimumStock.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory-item-maximum-stock">Stock máximo</Label>
              <Input
                id="inventory-item-maximum-stock"
                type="number"
                min={0}
                step="any"
                placeholder="Sin tope"
                {...register('maximumStock', {
                  setValueAs: (value) =>
                    value === '' || value === null ? null : Number(value),
                })}
              />
              {errors.maximumStock && (
                <p className="text-xs text-red-500">
                  {errors.maximumStock.message}
                </p>
              )}
            </div>
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
              <Label
                htmlFor="inventory-item-allow-menu"
                className="text-sm font-medium"
              >
                Permitir configuración en el menú del cliente
              </Label>
              <p className="text-xs text-muted-foreground">
                El cliente podrá personalizar este artículo al hacer su pedido
              </p>
            </div>
            <Controller
              control={control}
              name="allowMenuConfig"
              render={({ field }) => (
                <Switch
                  id="inventory-item-allow-menu"
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
              {isSubmitting ? 'Guardando...' : entity ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
