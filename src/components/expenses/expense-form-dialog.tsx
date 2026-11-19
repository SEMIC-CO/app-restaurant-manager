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
  MoneyInput,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { toISODate } from '@/utils';
import type { Expense } from '@/types';

/** Sentinel para "sin categoría" (Radix Select no admite value vacío). */
const NO_CATEGORY = 'none';

/** Sentinel para "sin método de pago". */
const NO_PAYMENT_METHOD = 'none';

const PAYMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Cash', label: 'Efectivo' },
  { value: 'Card', label: 'Tarjeta' },
  { value: 'Transfer', label: 'Transferencia' },
];

/**
 * Categorías lógicas de costos y gastos, agrupadas por naturaleza:
 * los **fijos** se repiten cada período y los **variables** dependen de la
 * operación. El backend guarda `category` como texto libre (máx. 100), así
 * que el catálogo vive aquí; el reporte financiero agrega por tipo de egreso
 * (nómina/compras/gastos), no por esta categoría.
 */
const EXPENSE_CATEGORY_GROUPS = [
  {
    label: 'Costos fijos',
    categories: [
      'Arriendo',
      'Servicios Públicos',
      'Seguros',
      'Impuestos y Trámites',
    ],
  },
  {
    label: 'Costos variables',
    categories: [
      'Insumos y Suministros',
      'Mantenimiento y Reparaciones',
      'Transporte y Logística',
      'Marketing y Publicidad',
      'Limpieza y Seguridad',
      'Otros',
    ],
  },
] as const;

const CATEGORY_SET: ReadonlySet<string> = new Set(
  EXPENSE_CATEGORY_GROUPS.flatMap((group) => group.categories),
);

const expenseSchema = z.object({
  concept: z
    .string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  category: z.string().max(100, 'Máximo 100 caracteres'),
  amount: z
    .number({ message: 'Ingresa el monto del gasto' })
    .min(0.01, 'El monto debe ser mayor a cero'),
  expenseDate: z.string().min(1, 'Selecciona la fecha del gasto'),
  paymentMethod: z.string(),
  notes: z.string().max(2000, 'Máximo 2000 caracteres'),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gasto en edición; sin él, el diálogo opera en modo creación. */
  expense?: Expense | null;
  onSubmit: (values: ExpenseFormData) => Promise<void>;
}

/**
 * Formulario de gasto operativo (react-hook-form + zod + shadcn/ui), mismo
 * patrón que `ProductFormDialog`. La categoría es un **select de catálogo**
 * (costos fijos/variables) con opción "Sin categoría"; método de pago y
 * notas son opcionales: `none`/vacío en el formulario = `null` en el payload.
 */
export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
}: ExpenseFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      concept: '',
      category: NO_CATEGORY,
      amount: 0,
      expenseDate: toISODate(),
      paymentMethod: NO_PAYMENT_METHOD,
      notes: '',
    },
  });

  React.useEffect(() => {
    if (open && expense) {
      reset({
        concept: expense.concept,
        category: expense.category ?? NO_CATEGORY,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        paymentMethod: expense.paymentMethod ?? NO_PAYMENT_METHOD,
        notes: expense.notes ?? '',
      });
    } else if (!open) {
      reset({
        concept: '',
        category: NO_CATEGORY,
        amount: 0,
        expenseDate: toISODate(),
        paymentMethod: NO_PAYMENT_METHOD,
        notes: '',
      });
    }
  }, [open, expense, reset]);

  const handleFormSubmit = async (values: ExpenseFormData) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? 'Actualiza los datos del gasto operativo.'
              : 'Registra un gasto operativo de la sede (arriendo, servicios, suministros).'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          {/* Concepto */}
          <div className="space-y-2">
            <Label htmlFor="expense-concept">Concepto *</Label>
            <Input
              id="expense-concept"
              placeholder="Ej. Arriendo local"
              {...register('concept')}
            />
            {errors.concept && (
              <p className="text-xs text-red-500">{errors.concept.message}</p>
            )}
          </div>

          {/* Monto y fecha */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Monto *</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="expense-amount"
                    placeholder="0.00"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Fecha *</Label>
              <Input
                id="expense-date"
                type="date"
                {...register('expenseDate')}
              />
              {errors.expenseDate && (
                <p className="text-xs text-red-500">
                  {errors.expenseDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Categoría y método de pago */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoría</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => {
                  // Valor legado fuera del catálogo (texto libre antiguo):
                  // se muestra como opción extra para no perderlo en edición.
                  const legacy =
                    field.value &&
                    field.value !== NO_CATEGORY &&
                    !CATEGORY_SET.has(field.value)
                      ? [field.value]
                      : [];
                  return (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="expense-category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY}>
                          Sin categoría
                        </SelectItem>
                        {EXPENSE_CATEGORY_GROUPS.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                        {legacy.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category} (valor actual)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.category && (
                <p className="text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-payment-method">Método de pago</Label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="expense-payment-method">
                      <SelectValue placeholder="Sin método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PAYMENT_METHOD}>
                        Sin método
                      </SelectItem>
                      {PAYMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="expense-notes">Notas</Label>
            <Textarea
              id="expense-notes"
              placeholder="Detalle adicional (opcional)..."
              rows={3}
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
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
              {isSubmitting
                ? 'Guardando…'
                : expense
                  ? 'Guardar Cambios'
                  : 'Crear Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
