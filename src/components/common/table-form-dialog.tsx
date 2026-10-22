import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import type { RestaurantTable, Section } from '@/types';

const tableSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(20, 'El nombre no puede superar los 20 caracteres'),
  cantPeople: z
    .number('La capacidad es requerida')
    .int('Debe ser un número entero')
    .min(1, 'Debe haber al menos 1 persona'),
  sectionId: z
    .number('Selecciona una sección')
    .min(1, 'Selecciona una sección'),
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
    watch,
    reset,
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: '', cantPeople: 1, sectionId: 0 },
  });

  React.useEffect(() => {
    if (open && table) {
      reset({ name: table.name, cantPeople: table.cantPeople, sectionId: table.sectionId });
    } else if (open) {
      reset({ name: '', cantPeople: 1, sectionId: 0 });
    } else {
      reset({ name: '', cantPeople: 1, sectionId: 0 });
    }
  }, [open, table, reset]);

  const selectedSectionId = watch('sectionId');

  const handleFormSubmit = async (data: TableFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando mesa:', error);
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
              : 'Completa los datos para crear una mesa en una sección'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Nombre de la Mesa *</Label>
            <Input id="table-name" placeholder="Mesa 1" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
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
              {isSubmitting ? 'Guardando...' : table ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
