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
  Textarea,
} from '@/components/ui';
import type { ApiInventoryCategory } from '@/types';

const inventoryCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(255, 'La descripción no puede superar los 255 caracteres'),
});

export type InventoryCategoryFormData = z.infer<typeof inventoryCategorySchema>;

interface InventoryCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita la categoría; si no, crea una nueva. */
  entity?: ApiInventoryCategory;
  onSubmit: (data: InventoryCategoryFormData) => Promise<void>;
}

/**
 * Formulario de categoría de inventario (crear/editar): nombre + descripción.
 * El diálogo se cierra solo si `onSubmit` resuelve; si lanza, permanece abierto
 * (mismo contrato que CategoryFormDialog, ver FORMS-GUIDE.md).
 */
export function InventoryCategoryFormDialog({
  open,
  onOpenChange,
  entity,
  onSubmit,
}: InventoryCategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InventoryCategoryFormData>({
    resolver: zodResolver(inventoryCategorySchema),
    defaultValues: { name: '', description: '' },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: entity?.name ?? '',
        description: entity?.description ?? '',
      });
    } else {
      reset({ name: '', description: '' });
    }
  }, [open, entity, reset]);

  const handleFormSubmit = async (data: InventoryCategoryFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        description: data.description.trim(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando categoría de inventario:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entity ? 'Editar Categoría' : 'Nueva Categoría de Inventario'}
          </DialogTitle>
          <DialogDescription>
            {entity
              ? 'Actualiza el nombre o la descripción de la categoría'
              : 'Agrupa tus artículos por tipo (p. ej. Materias primas, Limpieza)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inventory-category-name">Nombre *</Label>
            <Input
              id="inventory-category-name"
              placeholder="Materias primas"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory-category-description">
              Descripción (opcional)
            </Label>
            <Textarea
              id="inventory-category-description"
              placeholder="Insumos que se usan en la cocina"
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
