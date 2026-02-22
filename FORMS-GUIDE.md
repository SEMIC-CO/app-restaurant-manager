# Guía de Formularios con shadcn/ui + React Hook Form + Zod

## 📋 Stack de Formularios

- **shadcn/ui**: Componentes UI accesibles y personalizables
- **react-hook-form**: Gestión de formularios con alto rendimiento
- **zod**: Validación de esquemas TypeScript-first

## 🎯 Componentes UI Disponibles

### Básicos
- `Input` - Entrada de texto
- `Textarea` - Área de texto multi-línea
- `Label` - Etiquetas accesibles
- `Button` - Botones con variantes
- `Checkbox` - Casillas de verificación
- `Select` - Selector dropdown

### Contenedores
- `Card` - Tarjetas con header/content/footer
- `Dialog` - Modales/Diálogos

## 🚀 Patrón de Implementación

### 1. Definir el Schema de Validación con Zod

```typescript
import * as z from 'zod';

const userSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Debe ser mayor de edad'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debe aceptar los términos',
  }),
});

type UserFormData = z.infer<typeof userSchema>;
```

### 2. Configurar React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  watch,
  setValue,
  reset,
} = useForm<UserFormData>({
  resolver: zodResolver(userSchema),
  defaultValues: {
    name: '',
    email: '',
    age: 18,
    acceptTerms: false,
  },
});
```

### 3. Construir el Formulario con shadcn/ui

```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  {/* Input de texto */}
  <div className="space-y-2">
    <Label htmlFor="name">Nombre *</Label>
    <Input
      id="name"
      placeholder="Juan Pérez"
      {...register('name')}
    />
    {errors.name && (
      <p className="text-xs text-red-500">{errors.name.message}</p>
    )}
  </div>

  {/* Input numérico */}
  <div className="space-y-2">
    <Label htmlFor="age">Edad *</Label>
    <Input
      id="age"
      type="number"
      {...register('age', { valueAsNumber: true })}
    />
    {errors.age && (
      <p className="text-xs text-red-500">{errors.age.message}</p>
    )}
  </div>

  {/* Checkbox */}
  <div className="flex items-center gap-2">
    <Checkbox
      id="terms"
      checked={watch('acceptTerms')}
      onCheckedChange={(checked: boolean) => setValue('acceptTerms', checked)}
    />
    <Label htmlFor="terms" className="font-normal cursor-pointer">
      Acepto los términos
    </Label>
  </div>
  {errors.acceptTerms && (
    <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
  )}

  {/* Submit */}
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Guardando...' : 'Guardar'}
  </Button>
</form>
```

### 4. Manejar el Submit

```typescript
const onSubmit = async (data: UserFormData) => {
  try {
    await apiCall(data);
    reset(); // Limpiar formulario después del éxito
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📚 Ejemplos Completos

### ProductFormDialog
Formulario completo de producto con:
- Validación de campos requeridos
- Select para categorías
- Checkbox para disponibilidad
- Manejo de loading state

Ubicación: `src/components/common/product-form-dialog.tsx`

### CustomerFormDialog
Formulario de cliente con:
- Validación de email
- Validación de teléfono con regex
- Campos opcionales
- Reset al cerrar

Ubicación: `src/components/common/customer-form-dialog.tsx`

## 🎨 Validaciones Comunes con Zod

```typescript
// Strings
z.string().min(3, 'Mínimo 3 caracteres')
z.string().max(50, 'Máximo 50 caracteres')
z.string().email('Email inválido')
z.string().regex(/^\+?[0-9]+$/, 'Solo números')
z.string().optional() // Campo opcional

// Números
z.number().min(0, 'Debe ser positivo')
z.number().max(100, 'Máximo 100')
z.number().int('Debe ser entero')

// Booleans
z.boolean()
z.boolean().refine(val => val === true, 'Debe aceptar')

// Validación cruzada
z.object({
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Transformaciones
z.string().transform(val => val.trim().toLowerCase())
z.string().transform(Number) // String a número
```

## 🔧 Casos de Uso Especiales

### Select (Dropdown)

```tsx
<Select
  value={watch('categoryId')}
  onValueChange={(value) => setValue('categoryId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona..." />
  </SelectTrigger>
  <SelectContent>
    {options.map(opt => (
      <SelectItem key={opt.id} value={opt.id}>
        {opt.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Textarea

```tsx
<Textarea
  id="description"
  placeholder="Escribe aquí..."
  {...register('description')}
  rows={4}
/>
```

### Input con icono

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
  <Input
    placeholder="Buscar..."
    className="pl-10"
    {...register('search')}
  />
</div>
```

## ✅ Mejores Prácticas

1. **Siempre usar validación con Zod** - No confiar solo en HTML5
2. **Mostrar errores específicos** - Usar `errors.field.message`
3. **Deshabilitar submit durante loading** - `disabled={isSubmitting}`
4. **Reset después del éxito** - `reset()` limpia el formulario
5. **Usar `valueAsNumber`** - Para inputs numéricos: `{valueAsNumber: true}`
6. **Labels accesibles** - Usar `htmlFor` con `id` del input
7. **Feedback visual** - Estados de loading y éxito/error
8. **Validación en tiempo real** - React Hook Form lo hace automático

## 🎯 Estructura Recomendada

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── common/          # Formularios reutilizables
│       ├── product-form-dialog.tsx
│       ├── customer-form-dialog.tsx
│       └── ...
├── types/               # Schemas de Zod compartidos
│   └── index.ts
└── features/            # Páginas con formularios
    ├── auth/
    │   ├── login-page.tsx
    │   └── register-page.tsx
    └── ...
```

## 🔗 Referencias

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
