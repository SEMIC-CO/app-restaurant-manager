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
  Switch,
  Textarea,
  MoneyInput,
} from '@/components/ui';
import { formatCurrency } from '@/utils';
import {
  PAYROLL_FREQUENCY_LABELS,
  type ApiPayrollFrequency,
  type ApiPayrollTemplate,
} from '@/types';

/**
 * Configuración de pago de un empleado. Guarda la FRECUENCIA con la que se
 * paga y el MONTO BASE por período; el total de cada mes se recalcula al
 * cargar la nómina (los adelantos, bonos y descuentos puntuales se registran
 * como ajustes, no aquí).
 */
const payrollTemplateSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY']),
  baseAmount: z
    .number()
    .min(0, 'El monto base no puede ser negativo')
    .refine((value) => value > 0, 'El monto base debe ser mayor a cero'),
  notes: z.string().max(2000, 'Las notas no pueden superar los 2000 caracteres'),
  active: z.boolean(),
});

export type PayrollTemplateFormData = z.infer<typeof payrollTemplateSchema>;

interface PayrollTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita la configuración existente. */
  template?: ApiPayrollTemplate | null;
  /** Empleado sobre el que se configura el pago. */
  employeeName: string;
  onSubmit: (data: PayrollTemplateFormData) => Promise<void>;
}

const FREQUENCIES = Object.keys(PAYROLL_FREQUENCY_LABELS) as ApiPayrollFrequency[];

/**
 * Diálogo de configuración de nómina de un empleado. Reutiliza la estructura
 * del formulario de pago (monto + notas) más el selector de frecuencia.
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function PayrollTemplateFormDialog({
  open,
  onOpenChange,
  template,
  employeeName,
  onSubmit,
}: PayrollTemplateFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PayrollTemplateFormData>({
    resolver: zodResolver(payrollTemplateSchema),
    defaultValues: {
      frequency: 'MONTHLY',
      baseAmount: 0,
      notes: '',
      active: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        frequency: template?.frequency ?? 'MONTHLY',
        baseAmount: template?.baseAmount ?? 0,
        notes: template?.notes ?? '',
        active: template?.active ?? true,
      });
    } else {
      reset({ frequency: 'MONTHLY', baseAmount: 0, notes: '', active: true });
    }
  }, [open, template, reset]);

  const frequency = useWatch({ control, name: 'frequency' });
  const baseAmount = useWatch({ control, name: 'baseAmount' });

  const handleFormSubmit = async (data: PayrollTemplateFormData) => {
    try {
      await onSubmit({ ...data, notes: data.notes.trim() });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando configuración de nómina:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar configuración de nómina' : 'Configurar nómina'}
          </DialogTitle>
          <DialogDescription>
            Define con qué frecuencia y con qué monto base se paga a{' '}
            <span className="font-medium text-foreground">{employeeName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-frequency">Frecuencia de pago *</Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                setValue('frequency', value as ApiPayrollFrequency, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="template-frequency">
                <SelectValue placeholder="Selecciona la frecuencia" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PAYROLL_FREQUENCY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-xs text-red-500">{errors.frequency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-base-amount">
              Monto base por período *
            </Label>
            <Controller
              control={control}
              name="baseAmount"
              render={({ field }) => (
                <MoneyInput
                  id="template-base-amount"
                  placeholder="0.00"
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onValueChange={(value) =>
                    field.onChange(Number.isNaN(value) ? 0 : value)
                  }
                />
              )}
            />
            {errors.baseAmount && (
              <p className="text-xs text-red-500">{errors.baseAmount.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Es el subtotal que se pagará en cada período. Los adelantos, bonos
              y descuentos se agregan aparte y se restan/suman al cargar la
              nómina.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-notes">Notas</Label>
            <Textarea
              id="template-notes"
              placeholder="Observaciones sobre el pago de este empleado..."
              rows={3}
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label htmlFor="template-active" className="text-sm font-medium">
                Configuración activa
              </Label>
              <p className="text-xs text-muted-foreground">
                Solo las configuraciones activas se cargan en la nómina
              </p>
            </div>
            <Switch id="template-active" {...register('active')} />
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Se pagará{' '}
            <span className="font-medium text-foreground">
              {PAYROLL_FREQUENCY_LABELS[frequency].toLowerCase()}
            </span>{' '}
            por{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(Number.isFinite(baseAmount) ? baseAmount : 0)}
            </span>{' '}
            por período.
          </p>

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
              {isSubmitting ? 'Guardando...' : template ? 'Actualizar' : 'Configurar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
