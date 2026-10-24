import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Palette, X } from 'lucide-react';
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
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ApiCategory } from '@/types';

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  color: z
    .string()
    .refine(
      (value) => value === '' || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value),
      'Usa un color hexadecimal (ej. #F97316)',
    ),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo edita la categoría; si no, crea una nueva. */
  category?: ApiCategory;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

const PRESET_COLORS = [
  '#F97316',
  '#EF4444',
  '#22C55E',
  '#3B82F6',
  '#A855F7',
  '#EAB308',
  '#14B8A6',
  '#EC4899',
];

/**
 * Formulario de categoría (crear/editar): nombre + color opcional.
 * Sigue el patrón de SectionFormDialog: el diálogo se cierra solo si
 * `onSubmit` resuelve; si lanza, permanece abierto con el error en la página.
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', color: '' },
  });

  React.useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '', color: category?.color ?? '' });
    } else {
      reset({ name: '', color: '' });
    }
  }, [open, category, reset]);

  const color = useWatch({ control, name: 'color' });

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit({ name: data.name.trim(), color: data.color });
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando categoría:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          <DialogDescription>
            {category
              ? 'Actualiza el nombre o el color de la categoría'
              : 'Crea una categoría para agrupar productos (p. ej. Empanadas, Bebidas)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre de la Categoría *</Label>
            <Input id="category-name" placeholder="Empanadas" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-color">Color (opcional)</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Color ${preset}`}
                  onClick={() => setValue('color', preset, { shouldValidate: true })}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                    color === preset
                      ? 'border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}

              {/* Selector de color personalizado */}
              <label
                className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary"
                title="Elegir otro color"
              >
                <input
                  type="color"
                  aria-label="Elegir color personalizado"
                  value={color || '#F97316'}
                  onChange={(event) => setValue('color', event.target.value, { shouldValidate: true })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <Palette className="h-4 w-4" />
              </label>

              {color && (
                <button
                  type="button"
                  onClick={() => setValue('color', '', { shouldValidate: true })}
                  className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Quitar color
                </button>
              )}
            </div>
            {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
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
              {isSubmitting ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
