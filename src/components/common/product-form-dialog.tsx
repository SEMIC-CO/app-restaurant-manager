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
  MoneyInput,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
} from '@/components/ui';
import { toast, useImageUpload, type PreparedImage } from '@/hooks';
import { formatFileSize, resolveStorageUrl } from '@/utils';
import type { ApiProduct } from '@/types';

const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  categoryId: z.number().min(1, 'Selecciona una categoría'),
  isAvailable: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

/** Lo que el formulario entrega al caller: datos + imagen elegida (si la hay). */
export interface ProductFormSubmit {
  values: ProductFormData;
  /** Imagen ya pre-comprimida por `useImageUpload` (WebP ≤1MB). */
  imageFile: File | null;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Producto en edición; sin él, el diálogo opera en modo creación. */
  product?: ApiProduct | null;
  categories?: { id: number; name: string }[];
  onSubmit: (submit: ProductFormSubmit) => Promise<void>;
}

/**
 * Formulario de producto (react-hook-form + zod + shadcn/ui).
 *
 * En modo edición permite además reemplazar la imagen: se pre-comprime en el
 * navegador (`useImageUpload`) y el caller la sube con
 * `productService.uploadImage()` después de actualizar los datos.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories = [],
  onSubmit,
}: ProductFormDialogProps) {
  const [preparedImage, setPreparedImage] =
    React.useState<PreparedImage | null>(null);
  const { prepare } = useImageUpload();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          cost: product.cost,
          categoryId: product.categoryId,
          isAvailable: product.available ?? true,
        }
      : {
          name: '',
          description: '',
          price: 0,
          cost: 0,
          categoryId: 0,
          isAvailable: true,
        },
  });

  const isAvailable = watch('isAvailable');
  const selectedCategoryId = watch('categoryId');

  React.useEffect(() => {
    if (open && product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        cost: product.cost,
        categoryId: product.categoryId,
        isAvailable: product.available ?? true,
      });
    } else if (!open) {
      reset({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        categoryId: 0,
        isAvailable: true,
      });
      setPreparedImage(null);
    }
  }, [open, product, reset]);

  // El preview usa un Object URL: se libera al cambiar de imagen o al cerrar
  React.useEffect(() => {
    return () => {
      if (preparedImage) URL.revokeObjectURL(preparedImage.previewUrl);
    };
  }, [preparedImage]);

  const handleSelectImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const prepared = await prepare(file);
    if (!prepared) {
      toast({
        variant: 'warning',
        title: '❌ Imagen no válida',
        description: 'No se pudo procesar la imagen. Intenta con otra.',
      });
      return;
    }

    setPreparedImage(prepared);
    event.target.value = '';
  };

  const handleFormSubmit = async (values: ProductFormData) => {
    try {
      await onSubmit({ values, imageFile: preparedImage?.file ?? null });
      onOpenChange(false);
    } catch (error) {
      // El caller lanza para mantener el diálogo abierto
      console.error('Error guardando el producto:', error);
    }
  };

  const currentImageUrl = product ? resolveStorageUrl(product.imageUrl) : null;
  const previewUrl = preparedImage?.previewUrl ?? currentImageUrl;

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
            <Label htmlFor="product-name">Nombre del Producto *</Label>
            <Input
              id="product-name"
              placeholder="Empanada de Carne"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="product-description">Descripción *</Label>
            <Textarea
              id="product-description"
              placeholder="Describe el producto..."
              {...register('description')}
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Price, Cost and Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio *</Label>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <MoneyInput
                    id="product-price"
                    placeholder="0.00"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.price && (
                <p className="text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-cost">Costo *</Label>
              <Controller
                control={control}
                name="cost"
                render={({ field }) => (
                  <MoneyInput
                    id="product-cost"
                    placeholder="0.00"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />
              {errors.cost && (
                <p className="text-xs text-red-500">{errors.cost.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-category">Categoría *</Label>
              <Select
                value={selectedCategoryId ? String(selectedCategoryId) : ''}
                onValueChange={(value) => setValue('categoryId', Number(value), {
                  shouldValidate: true,
                })}
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
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

          {/* Image (sustitución en modo edición) */}
          {product && (
            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <div className="flex items-center gap-4 rounded-md border border-dashed p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={product.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-2xl">
                    🥟
                  </div>
                )}
                <div className="space-y-1">
                  <label
                    htmlFor="product-image"
                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    Cambiar imagen
                  </label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => void handleSelectImage(event)}
                  />
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG o WEBP hasta 5MB · se comprime a WebP antes de subir
                  </p>
                  {preparedImage && (
                    <p className="text-xs text-emerald-600">
                      ✓ Nueva imagen:{' '}
                      {formatFileSize(preparedImage.originalSize)} →{' '}
                      {formatFileSize(preparedImage.compressedSize)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="product-available"
              checked={isAvailable}
              onCheckedChange={(checked: boolean) => setValue('isAvailable', checked)}
            />
            <Label htmlFor="product-available" className="font-normal cursor-pointer">
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
