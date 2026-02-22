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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
} from '@/components/ui';

const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  isAvailable: z.boolean(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductFormData & { id: string };
  categories?: { id: string; name: string }[];
  onSubmit: (data: ProductFormData) => Promise<void>;
}

/**
 * Product form dialog with react-hook-form + zod validation
 * Example implementation for adding/editing products
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories = [],
  onSubmit,
}: ProductFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      description: '',
      price: 0 as number,
      categoryId: '',
      isAvailable: true,
      stock: 0 as number | undefined,
    },
  });

  const isAvailable = watch('isAvailable');

  React.useEffect(() => {
    if (open && product) {
      reset(product);
    } else if (!open) {
      reset({
        name: '',
        description: '',
        price: 0 as number,
        categoryId: '',
        isAvailable: true,
        stock: undefined,
      });
    }
  }, [open, product, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting product:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Producto' : 'Agregar Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Actualiza la información del producto'
              : 'Completa los datos para agregar un nuevo producto al catálogo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Producto *</Label>
            <Input
              id="name"
              placeholder="Empanada de Carne"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              placeholder="Describe el producto..."
              {...register('description')}
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Price and Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría *</Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Inicial (Opcional)</Label>
            <Input
              id="stock"
              type="number"
              placeholder="0"
              {...register('stock', { valueAsNumber: true })}
            />
            {errors.stock && (
              <p className="text-xs text-red-500">{errors.stock.message}</p>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isAvailable"
              checked={isAvailable}
              onCheckedChange={(checked: boolean) => setValue('isAvailable', checked)}
            />
            <Label htmlFor="isAvailable" className="font-normal cursor-pointer">
              Producto disponible para la venta
            </Label>
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
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
