import * as React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  MoneyInput,
} from '@/components/ui';
import type { ApiPayrollAdjustment, ApiPayrollAdjustmentStatus } from '@/types';

/**
 * Conceptos fijos del ajuste. El backend clasifica por la palabra clave del
 * concepto (`bono` suma; `adelanto`/`descuento` restan), así que con estos
 * valores la dirección ya no depende del signo del monto.
 */
const CONCEPT_OPTIONS = ['Adelanto', 'Descuento', 'Bono'] as const;

const payrollAdjustmentSchema = z.object({
  concept: z
    .string()
    .trim()
    .min(2, 'El concepto debe tener al menos 2 caracteres')
    .max(50, 'El concepto no puede superar los 50 caracteres'),
  adjustmentValue: z
    .number()
    .refine((value) => value !== 0, 'El valor del ajuste no puede ser cero'),
  description: z
    .string()
    .max(2000, 'La descripción no puede superar los 2000 caracteres'),
  status: z.enum(['EARRING', 'APPLIED', 'CANCELLED']),
});

export type PayrollAdjustmentFormData = z.infer<typeof payrollAdjustmentSchema>;

interface PayrollAdjustmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el ajuste; si no, crea uno nuevo. */
  adjustment?: ApiPayrollAdjustment;
  /** Empleado sobre el que se registra el ajuste. */
  employeeId: number;
  onSubmit: (data: PayrollAdjustmentFormData) => Promise<void>;
}

const STATUS_LABELS: Record<ApiPayrollAdjustmentStatus, string> = {
  EARRING: 'Pendiente de aplicar',
  APPLIED: 'Aplicado',
  CANCELLED: 'Cancelado',
};

/**
 * Formulario de ajuste de nómina (crear/editar): concepto, valor y estado.
 * El signo del valor indica la dirección (positivo suma, negativo descuenta);
 * el estado es de aprobación. El diálogo se cierra solo si `onSubmit`
 * resuelve; si lanza, permanece abierto.
 */
export function PayrollAdjustmentFormDialog({
  open,
  onOpenChange,
  adjustment,
  employeeId,
  onSubmit,
}: PayrollAdjustmentFormDialogProps) {
  const isEdit = Boolean(adjustment);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PayrollAdjustmentFormData>({
    resolver: zodResolver(payrollAdjustmentSchema),
    defaultValues: {
      concept: '',
      adjustmentValue: 0,
      description: '',
      status: 'EARRING',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        concept: adjustment?.concept ?? '',
        adjustmentValue: adjustment?.adjustmentValue ?? 0,
        description: adjustment?.description ?? '',
        status: adjustment?.status ?? 'EARRING',
      });
    } else {
      reset({ concept: '', adjustmentValue: 0, description: '', status: 'EARRING' });
    }
  }, [open, adjustment, reset]);

  // Al crear no se ofrece "Cancelado" (solo se alcanza con DELETE).
  const availableStatuses: ApiPayrollAdjustmentStatus[] = isEdit
    ? ['EARRING', 'APPLIED', 'CANCELLED']
    : ['EARRING', 'APPLIED'];

  const status = useWatch({ control, name: 'status' });
  const concept = useWatch({ control, name: 'concept' });

  // Ajustes antiguos con texto libre ("Adelanto quincenal"): se conserva como
  // opción extra al editar para no perder ni cambiar el dato guardado.
  const conceptOptions = React.useMemo(() => {
    const options: string[] = [...CONCEPT_OPTIONS];
    if (adjustment?.concept && !options.includes(adjustment.concept)) {
      options.push(adjustment.concept);
    }
    return options;
  }, [adjustment]);

  const handleFormSubmit = async (data: PayrollAdjustmentFormData) => {
    // El concepto ya define la dirección (bono suma, adelanto/descuento resta),
    // así que el signo se normaliza para dejar los datos como siempre:
    // adelantos y descuentos en negativo, bonos en positivo.
    const normalizedValue =
      data.concept === 'Bono'
        ? Math.abs(data.adjustmentValue)
        : -Math.abs(data.adjustmentValue);

    try {
      await onSubmit({
        ...data,
        concept: data.concept.trim(),
        adjustmentValue: normalizedValue,
        description: data.description.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando ajuste:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Ajuste' : 'Nuevo Ajuste de Nómina'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza el concepto, el valor o el estado del ajuste'
              : `Adelanto, bono o descuento del empleado #${employeeId}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjustment-concept">Concepto *</Label>
            <Select
              value={concept}
              onValueChange={(value) =>
                setValue('concept', value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="adjustment-concept">
                <SelectValue placeholder="Selecciona el concepto" />
              </SelectTrigger>
              <SelectContent>
                {conceptOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.concept && (
              <p className="text-xs text-red-500">{errors.concept.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment-value">Valor *</Label>
            <Controller
              control={control}
              name="adjustmentValue"
              render={({ field }) => (
                <MoneyInput
                  id="adjustment-value"
                  placeholder="0.00"
                  value={Math.abs(Number.isFinite(field.value) ? field.value : 0)}
                  onValueChange={(value) =>
                    field.onChange(Number.isNaN(value) ? 0 : Math.abs(value))
                  }
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {concept === 'Bono'
                ? 'Suma al pago del empleado.'
                : 'Resta al pago del empleado (se descuenta).'}
              {' '}No puede ser 0.
            </p>
            {errors.adjustmentValue && (
              <p className="text-xs text-red-500">{errors.adjustmentValue.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment-status">Estado</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue('status', value as ApiPayrollAdjustmentStatus, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="adjustment-status">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {STATUS_LABELS[statusOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment-description">Descripción</Label>
            <Textarea
              id="adjustment-description"
              placeholder="Motivo o detalle del ajuste..."
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
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
