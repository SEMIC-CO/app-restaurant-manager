import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator } from 'lucide-react';
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
  Textarea,
} from '@/components/ui';
import type { ApiPaymentEmployee } from '@/types';

const paymentEmployeeSchema = z
  .object({
    periodStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha inicial del período'),
    periodEndDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha final del período'),
    subtotal: z.number().min(0, 'El subtotal no puede ser negativo'),
    totalAdvances: z.number().min(0, 'Los adelantos no pueden ser negativos'),
    totalDeductions: z.number().min(0, 'Los descuentos no pueden ser negativos'),
    totalPaid: z.number().min(0, 'El total pagado no puede ser negativo'),
    notes: z.string().max(2000, 'Las notas no pueden superar los 2000 caracteres'),
    status: z.enum(['DRAFT', 'PAID']),
  })
  .refine((data) => data.periodEndDate >= data.periodStartDate, {
    message: 'La fecha final no puede ser anterior a la inicial',
    path: ['periodEndDate'],
  });

export type PaymentEmployeeFormData = z.infer<typeof paymentEmployeeSchema>;

interface PaymentEmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita el pago; si no, crea uno nuevo. */
  payment?: ApiPaymentEmployee;
  /** Empleado sobre el que se registra el pago. */
  employeeId: number;
  onSubmit: (data: PaymentEmployeeFormData) => Promise<void>;
}

const STATUS_LABELS: Record<'DRAFT' | 'PAID', string> = {
  DRAFT: 'Borrador (sin pagar)',
  PAID: 'Pagado',
};

/**
 * Formulario de pago de nómina (crear/editar): período, montos y notas.
 * Los montos los define el usuario (el backend los guarda tal cual); el botón
 * "Calcular" propone `totalPaid = subtotal − adelantos − descuentos`.
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto.
 */
export function PaymentEmployeeFormDialog({
  open,
  onOpenChange,
  payment,
  employeeId,
  onSubmit,
}: PaymentEmployeeFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PaymentEmployeeFormData>({
    resolver: zodResolver(paymentEmployeeSchema),
    defaultValues: {
      periodStartDate: '',
      periodEndDate: '',
      subtotal: 0,
      totalAdvances: 0,
      totalDeductions: 0,
      totalPaid: 0,
      notes: '',
      status: 'PAID',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        periodStartDate: payment?.periodStartDate ?? '',
        periodEndDate: payment?.periodEndDate ?? '',
        subtotal: payment?.subtotal ?? 0,
        totalAdvances: payment?.totalAdvances ?? 0,
        totalDeductions: payment?.totalDeductions ?? 0,
        totalPaid: payment?.totalPaid ?? 0,
        notes: payment?.notes ?? '',
        status: payment?.status === 'DRAFT' ? 'DRAFT' : 'PAID',
      });
    } else {
      reset({
        periodStartDate: '',
        periodEndDate: '',
        subtotal: 0,
        totalAdvances: 0,
        totalDeductions: 0,
        totalPaid: 0,
        notes: '',
        status: 'PAID',
      });
    }
  }, [open, payment, reset]);

  const subtotal = useWatch({ control, name: 'subtotal' });
  const totalAdvances = useWatch({ control, name: 'totalAdvances' });
  const totalDeductions = useWatch({ control, name: 'totalDeductions' });
  const status = useWatch({ control, name: 'status' });

  const suggestedTotal = Math.max(0, subtotal - totalAdvances - totalDeductions);

  const handleFormSubmit = async (data: PaymentEmployeeFormData) => {
    try {
      await onSubmit({ ...data, notes: data.notes.trim() });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando pago:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? 'Editar Pago' : 'Nuevo Pago de Nómina'}</DialogTitle>
          <DialogDescription>
            {payment
              ? 'Actualiza el período y los montos del pago'
              : `Registra el pago del empleado #${employeeId} por un período`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-period-start">Inicio del período *</Label>
              <Input
                id="payment-period-start"
                type="date"
                {...register('periodStartDate')}
              />
              {errors.periodStartDate && (
                <p className="text-xs text-red-500">{errors.periodStartDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-period-end">Fin del período *</Label>
              <Input id="payment-period-end" type="date" {...register('periodEndDate')} />
              {errors.periodEndDate && (
                <p className="text-xs text-red-500">{errors.periodEndDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-subtotal">Subtotal *</Label>
            <Input
              id="payment-subtotal"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('subtotal', { valueAsNumber: true })}
            />
            {errors.subtotal && (
              <p className="text-xs text-red-500">{errors.subtotal.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-advances">Adelantos *</Label>
              <Input
                id="payment-advances"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('totalAdvances', { valueAsNumber: true })}
              />
              {errors.totalAdvances && (
                <p className="text-xs text-red-500">{errors.totalAdvances.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-deductions">Descuentos *</Label>
              <Input
                id="payment-deductions"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('totalDeductions', { valueAsNumber: true })}
              />
              {errors.totalDeductions && (
                <p className="text-xs text-red-500">{errors.totalDeductions.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-total-paid">Total pagado *</Label>
              <button
                type="button"
                onClick={() => setValue('totalPaid', suggestedTotal, { shouldValidate: true })}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                title="Propone subtotal menos adelantos y descuentos"
              >
                <Calculator className="h-3.5 w-3.5" />
                Calcular ({suggestedTotal.toFixed(2)})
              </button>
            </div>
            <Input
              id="payment-total-paid"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('totalPaid', { valueAsNumber: true })}
            />
            {errors.totalPaid && (
              <p className="text-xs text-red-500">{errors.totalPaid.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-status">Estado</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setValue('status', value as 'DRAFT' | 'PAID', { shouldValidate: true })
              }
            >
              <SelectTrigger id="payment-status">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as Array<'DRAFT' | 'PAID'>).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notas</Label>
            <Textarea
              id="payment-notes"
              placeholder="Quincena de octubre, observaciones..."
              rows={3}
              {...register('notes')}
            />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
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
              {isSubmitting ? 'Guardando...' : payment ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
