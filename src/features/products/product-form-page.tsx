import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
  Switch,
  Badge,
} from '@/components/ui';
import { ConfigLayout } from '@/app/layout';
import { ImagePlus, Upload } from 'lucide-react';
import { formatCurrency, formatFileSize, resolveStorageUrl } from '@/utils';
import { ConfigSidebar } from '@/components/common';
import { toast, useImageUpload, type PreparedImage } from '@/hooks';
import { categoryService, productService } from '@/services';
import type {
  ApiCategory,
  ApiProduct,
  ApiResponse,
  CreateProductPayload,
} from '@/types';

const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  isAvailable: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

function isAbsoluteUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

/**
 * Formulario único de producto para **crear** (`/productos/nuevo`) y
 * **editar** (`/productos/:productId/editar`): mismos campos en ambos modos;
 * al editar se precarga el producto y al guardar hace `PUT` (+ subida de
 * imagen si se eligió una nueva).
 */
export function ProductFormPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(productId);

  const [editingProduct, setEditingProduct] = React.useState<ApiProduct | null>(
    null,
  );
  const [imagePreview, setImagePreview] = React.useState<string>('');
  const [preparedImage, setPreparedImage] = React.useState<PreparedImage | null>(
    null,
  );
  const [categories, setCategories] = React.useState<ApiCategory[]>([]);
  const { prepare, upload, status } = useImageUpload();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      price: 0,
      cost: 0,
      description: '',
      imageUrl: '',
      isAvailable: true,
    },
  });

  const formValues = watch();
  const selectedCategory = categories.find(
    (category) => category.id === Number(formValues.categoryId),
  );

  const loadingProduct = isEditing && editingProduct === null;

  // Categorías reales de la sede (para poder asignar categoryId)
  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const resp = await categoryService.list({ limit: 100, active: true });
        if (active && resp.code === 200) {
          setCategories(resp.data.items.filter((category) => category.active));
        }
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar categorías',
          description: 'No se pudieron cargar las categorías.',
        });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Modo edición: carga el producto y precarga el MISMO formulario
  React.useEffect(() => {
    if (!productId) return;
    const id = Number(productId);
    if (!Number.isInteger(id)) {
      toast({
        variant: 'warning',
        title: '❌ Producto no encontrado',
        description: 'El identificador del producto no es válido.',
      });
      navigate('/configuracion/productos');
      return;
    }

    let active = true;
    void (async () => {
      try {
        const resp = await productService.getById(id);
        if (!active) return;
        if (resp.code !== 200 || !resp.data) {
          toast({
            variant: 'warning',
            title: '❌ Producto no encontrado',
            description: apiErrorMessage(
              resp,
              'No se pudo cargar el producto.',
            ),
          });
          navigate('/configuracion/productos');
          return;
        }

        const product = resp.data;
        setEditingProduct(product);
        reset({
          name: product.name,
          description: product.description ?? '',
          price: Number(product.price),
          cost: Number(product.cost),
          categoryId: String(product.categoryId),
          imageUrl: isAbsoluteUrl(product.imageUrl) ? product.imageUrl : '',
          isAvailable: product.available ?? true,
        });
      } catch {
        if (!active) return;
        toast({
          variant: 'warning',
          title: '❌ Error al cargar producto',
          description: 'No se pudo conectar con el servidor.',
        });
        navigate('/configuracion/productos');
      }
    })();
    return () => {
      active = false;
    };
  }, [productId, reset, navigate]);

  // El preview usa un Object URL: se libera al cambiar de imagen o al salir
  React.useEffect(() => {
    return () => {
      if (preparedImage) URL.revokeObjectURL(preparedImage.previewUrl);
    };
  }, [preparedImage]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Pre-compresión en el navegador (≤1MB, 1920px, WebP) antes de subir
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
    setImagePreview(prepared.previewUrl);
    setValue('imageUrl', ''); // la imagen subida tiene prioridad
    event.target.value = ''; // permite volver a elegir el mismo archivo
  };

  const handleImageUrlChange = (url: string) => {
    setValue('imageUrl', url);
    if (url) {
      setImagePreview(url);
      setPreparedImage(null); // usar URL externa anula el archivo subido
    }
  };

  const handleRemoveImage = () => {
    setPreparedImage(null); // el effect revoca el Object URL
    setImagePreview('');
    setValue('imageUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload: CreateProductPayload = {
      name: data.name,
      categoryId: Number(data.categoryId),
      price: data.price,
      cost: data.cost,
      available: data.isAvailable,
      description: data.description,
      ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
    };

    // ===== Modo edición: mismo formulario, otro endpoint =====
    if (isEditing && editingProduct) {
      const resp = await productService.update(editingProduct.id, payload);
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al actualizar producto',
          description: apiErrorMessage(
            resp,
            'Ocurrió un error al guardar el producto.',
          ),
        });
        return;
      }

      if (preparedImage) {
        const uploaded = await upload(editingProduct.id, preparedImage.file);
        if (!uploaded) {
          toast({
            variant: 'warning',
            title: '⚠️ Producto actualizado sin imagen',
            description:
              'Los datos se guardaron, pero la imagen no se pudo subir.',
          });
          navigate('/configuracion/productos');
          return;
        }
      }

      toast({
        variant: 'success',
        title: '✅ Producto actualizado',
        description: `El producto "${payload.name}" se ha actualizado correctamente.`,
      });
      navigate('/configuracion/productos');
      return;
    }

    // ===== Modo creación =====
    let resp: ApiResponse<ApiProduct>;
    try {
      resp = await productService.create(payload);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al crear producto',
        description: 'No se pudo conectar con el servidor.',
      });
      return;
    }

    if (resp.code !== 201 && resp.code !== 200) {
      toast({
        variant: 'warning',
        title: '❌ Error al crear producto',
        description: apiErrorMessage(
          resp,
          'Ocurrió un error al guardar el producto.',
        ),
      });
      return;
    }

    const product = resp.data;

    // El producto ya existe: si hay imagen elegida, súbela por multipart
    if (preparedImage) {
      const uploaded = await upload(product.id, preparedImage.file);
      if (!uploaded) {
        toast({
          variant: 'warning',
          title: '⚠️ Producto creado sin imagen',
          description:
            'El producto se creó, pero la imagen no se pudo subir. Puedes agregarla al editarlo.',
        });
        navigate('/configuracion/productos');
        return;
      }
    }

    toast({
      variant: 'success',
      title: '✅ Producto creado',
      description: `El producto "${product.name}" se ha creado correctamente.`,
    });
    navigate('/configuracion/productos');
  };

  const handleCancel = () => {
    navigate('/configuracion/productos');
  };

  const isCompressing = status === 'compressing';
  const isUploading = status === 'uploading';

  // Imagen visible: la local (archivo/URL elegida) o la guardada (edición)
  const storedImageUrl = editingProduct
    ? resolveStorageUrl(editingProduct.imageUrl)
    : null;
  const previewSrc = imagePreview || storedImageUrl || '';
  const hasLocalImageSelection = imagePreview !== '';

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Product Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  placeholder="Ej: Empanada de Carne Suave"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formValues.categoryId}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger id="category">
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

              {/* Price and Cost */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio de Venta</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Controller
                      control={control}
                      name="price"
                      render={({ field }) => (
                        <MoneyInput
                          id="price"
                          placeholder="0.00"
                          className="pl-7"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Costo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Controller
                      control={control}
                      name="cost"
                      render={({ field }) => (
                        <MoneyInput
                          id="cost"
                          placeholder="0.00"
                          className="pl-7"
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  {errors.cost && (
                    <p className="text-xs text-red-500">{errors.cost.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe los ingredientes o características del producto..."
                  rows={4}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Image & Settings */}
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Imagen del Producto</Label>
                <div className="border-2 border-dashed rounded-lg p-8">
                  {previewSrc ? (
                    <div className="relative">
                      <img
                        src={previewSrc}
                        alt="Preview"
                        className="mx-auto h-48 w-full object-cover rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Cambiar
                        </Button>
                        {hasLocalImageSelection && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                      {!hasLocalImageSelection && storedImageUrl && (
                        <p className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
                          Imagen actual
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary font-medium hover:underline">
                          Subir un archivo
                        </span>
                        <span className="text-muted-foreground"> o arrastrar y soltar</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG o WEBP hasta 5MB · se comprime a WebP ≤1MB antes de
                        subir
                      </p>
                    </div>
                  )}
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => void handleImageUpload(event)}
                  />
                </div>

                {/* Estado de la pre-compresión */}
                {isCompressing && (
                  <p className="text-xs text-muted-foreground">
                    ⏳ Comprimiendo imagen…
                  </p>
                )}
                {preparedImage && !isCompressing && (
                  <p className="text-xs text-emerald-600">
                    ✓ Imagen lista:{' '}
                    {formatFileSize(preparedImage.originalSize)} →{' '}
                    {formatFileSize(preparedImage.compressedSize)} (WebP)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de Imagen Externa</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formValues.imageUrl || ''}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Alternativa al archivo: si subes una imagen, esta URL se ignora.
                </p>
                {errors.imageUrl && (
                  <p className="text-xs text-red-500">{errors.imageUrl.message}</p>
                )}
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="availability">Disponibilidad</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que el producto se vea en el menú
                  </p>
                </div>
                <Switch
                  id="availability"
                  checked={formValues.isAvailable}
                  onCheckedChange={(checked) => setValue('isAvailable', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      🥟
                    </div>
                  )}
                  {formValues.price > 0 && (
                    <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground">
                      {formatCurrency(formValues.price)}
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground">
                    {formValues.name || 'Nombre del Producto'}
                  </h3>
                  <p className="text-sm text-primary font-medium">
                    {formValues.price > 0 ? formatCurrency(formValues.price) : '$0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCategory
                      ? selectedCategory.name
                      : 'Categoría no seleccionada'}
                  </p>
                </div>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 mt-6 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Upload className="h-4 w-4" />
          {isSubmitting
            ? isUploading
              ? 'Subiendo imagen…'
              : 'Guardando...'
            : isEditing
              ? 'Guardar Cambios'
              : 'Guardar Producto'}
        </Button>
      </div>
    </form>
  );

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span
                className="cursor-pointer hover:text-foreground"
                onClick={() => navigate('/configuracion/productos')}
              >
                Productos
              </span>
              <span>/</span>
              <span className="text-foreground">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administración de Productos</h1>
              <p className="text-muted-foreground">
                {isEditing
                  ? 'Actualiza los datos del producto.'
                  : 'Configura los detalles del producto basado en el inventario actual.'}
              </p>
            </div>
          </div>

          {loadingProduct ? (
            <div className="mx-auto max-w-6xl border-b bg-background px-6 py-10 rounded-lg text-center text-sm text-muted-foreground">
              Cargando producto…
            </div>
          ) : (
            formContent
          )}
        </div>
      }
    />
  );
}
