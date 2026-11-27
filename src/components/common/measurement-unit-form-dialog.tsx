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
import type { ApiMeasurementUnit } from '@/types';
import { MEASUREMENT_UNIT_TYPE_OPTIONS } from './measurement-unit-labels';

const measurementUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  abbreviation: z
    .string()
    .trim()
    .min(1, 'La abreviatura es obligatoria')
    .max(15, 'La abreviatura no puede superar los 15 caracteres'),
  type: z.enum(['QUANTITY', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'PACKAGING'], {
    message: 'Selecciona un tipo de unidad',
  }),
  isActive: z.boolean(),
});

export type MeasurementUnitFormData = z.infer<typeof measurementUnitSchema>;

interface MeasurementUnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita la unidad; si no, crea una nueva. */
  entity?: ApiMeasurementUnit;
  onSubmit: (data: MeasurementUnitFormData) => Promise<void>;
}

/**
 * Formulario de unidad de medida (crear/editar): nombre, abreviatura, tipo y
 * estado. En edición el switch controla `isActive` (desactivar en el panel se
 * hace con DELETE; reactivar con PUT `isActive`).
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto
 * (mismo contrato que InventoryCategoryFormDialog, ver FORMS-GUIDE.md).
 */
export function MeasurementUnitFormDialog({
  open,
  onOpenChange,
  entity,
  onSubmit,
}: MeasurementUnitFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MeasurementUnitFormData>({
    resolver: zodResolver(measurementUnitSchema),
    defaultValues: { name: '', abbreviation: '', type: 'QUANTITY', isActive: true },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: entity?.name ?? '',
        abbreviation: entity?.abbreviation ?? '',
        type: entity?.type ?? 'QUANTITY',
        isActive: entity?.isActive ?? true,
      });
    } else {
      reset({ name: '', abbreviation: '', type: 'QUANTITY', isActive: true });
    }
  }, [open, entity, reset]);

  const handleFormSubmit = async (data: MeasurementUnitFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        abbreviation: data.abbreviation.trim(),
        type: data.type,
        isActive: data.isActive,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando unidad de medida:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>
            {entity ? 'Editar Unidad' : 'Nueva Unidad de Medida'}
          </DialogTitle>
          <DialogDescription>
            {entity
              ? 'Actualiza los datos de la unidad de medida'
              : 'Define las unidades en que se mide tu inventario (p. ej. Kilogramo, Caja)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="measurement-unit-name">Nombre *</Label>
            <Input
              id="measurement-unit-name"
              placeholder="Kilogramo"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurement-unit-abbreviation">
              Abreviatura *
            </Label>
            <Input
              id="measurement-unit-abbreviation"
              placeholder="kg"
              maxLength={15}
              {...register('abbreviation')}
            />
            {errors.abbreviation && (
              <p className="text-xs text-red-500">
                {errors.abbreviation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEASUREMENT_UNIT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <Label
                htmlFor="measurement-unit-active"
                className="text-sm font-medium"
              >
                Unidad activa
              </Label>
              <p className="text-xs text-muted-foreground">
                Las inactivas no se ofrecen al configurar artículos
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="measurement-unit-active"
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
