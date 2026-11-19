import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { toast } from '@/hooks';
import type { RestaurantTable, Section } from '@/types';

const tableSchema = z
  .object({
    name: z
      .string()
      .max(20, 'El nombre no puede superar los 20 caracteres'),
    cantPeople: z
      .number('La capacidad es requerida')
      .int('Debe ser un número entero')
      .min(1, 'Debe haber al menos 1 persona'),
    sectionId: z
      .number('Selecciona una sección')
      .min(1, 'Selecciona una sección'),
    /** Solo en creación: genera "Mesa 1"…"Mesa N" automáticamente. */
    quantity: z
      .number('La cantidad es requerida')
      .int('Debe ser un número entero')
      .min(1, 'Debe haber al menos 1 mesa')
      .max(50, 'Se pueden crear hasta 50 mesas por vez'),
  })
  .superRefine((data, ctx) => {
    // Con cantidad > 1 el nombre se genera solo (Mesa 1, Mesa 2, ...).
    if (data.quantity <= 1 && data.name.trim().length < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'El nombre es requerido',
      });
    }
  });

export type TableFormData = z.infer<typeof tableSchema>;

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: RestaurantTable;
  sections: Section[];
  onSubmit: (data: TableFormData) => Promise<void>;
}

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  sections,
  onSubmit,
}: TableFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    reset,
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: '', cantPeople: 1, sectionId: 0, quantity: 1 },
  });

  React.useEffect(() => {
    if (open && table) {
      reset({
        name: table.name,
        cantPeople: table.cantPeople,
        sectionId: table.sectionId,
        quantity: 1,
      });
    } else if (open) {
      reset({ name: '', cantPeople: 1, sectionId: 0, quantity: 1 });
    } else {
      reset({ name: '', cantPeople: 1, sectionId: 0, quantity: 1 });
    }
  }, [open, table, reset]);

  const selectedSectionId = useWatch({ control, name: 'sectionId' });
  const quantity = useWatch({ control, name: 'quantity' }) ?? 1;
  const nameValue = useWatch({ control, name: 'name' }) ?? '';
  /** Modo masivo: genera "{base} 1"…"{base} N" (base = nombre sin números). */
  const bulkMode = !table && quantity > 1;
  const baseName =
    nameValue.trim().replace(/\s+\d+$/, '') || 'Mesa';

  const handleFormSubmit = async (data: TableFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando mesa:', error);
      toast({
        variant: 'warning',
        title: '❌ No se pudo guardar',
        description:
          'Ocurrió un error inesperado. Revisa los datos e inténtalo de nuevo.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{table ? 'Editar Mesa' : 'Nueva Mesa'}</DialogTitle>
          <DialogDescription>
            {table
              ? 'Actualiza los datos de la mesa'
              : bulkMode
                ? `Se crearán ${quantity} mesas numeradas: ${baseName} 1, ${baseName} 2, …`
                : 'Completa los datos para crear una mesa, o indica una cantidad para crear varias de golpe.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
          {/* Cantidad (solo al crear): alta masiva {base} 1 … {base} N */}
          {!table && (
            <div className="space-y-2">
              <Label htmlFor="table-quantity">Cantidad de mesas *</Label>
              <Input
                id="table-quantity"
                type="number"
                min={1}
                max={50}
                placeholder="1"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-xs text-red-500">{errors.quantity.message}</p>
              )}
            </div>
          )}

          {/* Nombre: individual exacto, o base numerada en el modo masivo */}
          <div className="space-y-2">
            <Label htmlFor="table-name">
              {bulkMode ? 'Nombre base de las mesas' : 'Nombre de la Mesa *'}
            </Label>
            <Input id="table-name" placeholder="Mesa" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            {bulkMode && (
              <p className="text-xs text-muted-foreground">
                Se crearán: {baseName} 1, {baseName} 2
                {quantity > 2 ? ', …' : ''} hasta {baseName} {quantity} (se
                respetan los nombres ya existentes en la sección).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantPeople">Capacidad (personas) *</Label>
            <Input
              id="cantPeople"
              type="number"
              min={1}
              placeholder="4"
              {...register('cantPeople', { valueAsNumber: true })}
            />
            {errors.cantPeople && (
              <p className="text-xs text-red-500">{errors.cantPeople.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-section">Sección *</Label>
            <Select
              value={selectedSectionId ? String(selectedSectionId) : ''}
              onValueChange={(value) =>
                setValue('sectionId', Number(value), { shouldValidate: true })
              }
            >
              <SelectTrigger id="table-section">
                <SelectValue placeholder="Selecciona una sección" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sectionId && (
              <p className="text-xs text-red-500">{errors.sectionId.message}</p>
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
                ? 'Guardando...'
                : table
                  ? 'Actualizar'
                  : quantity > 1
                    ? `Crear ${quantity} mesas`
                    : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
