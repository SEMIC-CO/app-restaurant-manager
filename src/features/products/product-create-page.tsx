import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input, 
  Label, 
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge
} from '@/components/ui';
import { DashboardLayout } from '@/app/layout';
import { ImagePlus, Upload } from 'lucide-react';
import { formatCurrency } from '@/utils';

const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor a 0').optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  isAvailable: z.boolean(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Mock categories
const categories = [
  { id: '1', name: 'Empanadas de Carne' },
  { id: '2', name: 'Empanadas de Pollo' },
  { id: '3', name: 'Empanadas de Queso' },
  { id: '4', name: 'Empanadas Vegetarianas' },
  { id: '5', name: 'Bebidas' },
  { id: '6', name: 'Postres' },
];

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = React.useState<string>('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
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
      stock: 0,
    },
  });

  const formValues = watch();
  const selectedCategory = categories.find(c => c.id === formValues.categoryId);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setValue('imageUrl', ''); // Clear external URL when uploading file
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setValue('imageUrl', url);
    if (url) {
      setImagePreview(url);
      setUploadedFile(null); // Clear uploaded file when using external URL
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    // TODO: Implement product creation logic
    console.log('Product data:', data);
    console.log('Uploaded file:', uploadedFile);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navigate back to products list
    navigate('/productos');
  };

  const handleCancel = () => {
    navigate('/productos');
  };

  return (
    <DashboardLayout
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="cursor-pointer hover:text-foreground">Productos</span>
              <span>/</span>
              <span className="text-foreground">Nuevo Producto</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administración de Productos</h1>
              <p className="text-muted-foreground">
                Configura los detalles del producto basado en el inventario actual.
              </p>
            </div>
          </div>

          {/* Form Content */}
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

                    {/* Price and Cost */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio de Venta</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            {...register('price', { valueAsNumber: true })}
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
                          <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7"
                            {...register('cost', { valueAsNumber: true })}
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
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="mx-auto h-48 w-full object-cover rounded"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setImagePreview('');
                                setUploadedFile(null);
                                setValue('imageUrl', '');
                              }}
                            >
                              Cambiar
                            </Button>
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
                              PNG, JPG, GIF hasta 5MB
                            </p>
                            <input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                        )}
                      </div>
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
                        onCheckedChange={(checked: boolean) => setValue('isAvailable', checked)}
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
                        {imagePreview ? (
                          <img
                            src={imagePreview}
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
                          {selectedCategory ? selectedCategory.name : 'Categoría no seleccionada'}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
}
