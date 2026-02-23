import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
} from '@/components/ui';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import { UserPlus, ArrowLeft } from 'lucide-react';

const userSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  role: z.enum(['admin', 'manager', 'cashier', 'kitchen', 'delivery']),
  username: z.string().min(4, 'El usuario debe tener al menos 4 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  isActive: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type UserFormData = z.infer<typeof userSchema>;

const roles = [
  { id: 'admin', name: 'Administrador', description: 'Acceso total al sistema' },
  { id: 'manager', name: 'Gerente', description: 'Gestión de productos y reportes' },
  { id: 'cashier', name: 'Cajero', description: 'Punto de venta y facturación' },
  { id: 'kitchen', name: 'Cocina', description: 'Visualización de pedidos' },
  { id: 'delivery', name: 'Delivery', description: 'Control de entregas' },
];

export function UserCreatePage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: undefined,
      username: '',
      password: '',
      confirmPassword: '',
      isActive: true,
    },
  });

  const formValues = watch();
  const selectedRole = roles.find((r) => r.id === formValues.role);

  const onSubmit = async (data: UserFormData) => {
    console.log('User data:', data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    navigate('/configuracion/usuarios');
  };

  const handleCancel = () => {
    navigate('/configuracion/usuarios');
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="cursor-pointer hover:text-foreground">Usuarios</span>
                <span>/</span>
                <span className="text-foreground">Nuevo Usuario</span>
              </div>
            </div>
            <div className="ml-14">
              <h1 className="text-2xl font-bold">Crear Nuevo Usuario</h1>
              <p className="text-muted-foreground">
                Agrega un nuevo usuario al sistema y asigna sus permisos
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column - Personal Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Información Personal</h3>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Juan Pérez"
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@ejemplo.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+52 123 456 7890"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol en el Sistema</Label>
                    <Select
                      value={formValues.role}
                      onValueChange={(value) => setValue('role', value as any)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{role.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {role.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-xs text-red-500">{errors.role.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Account Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Credenciales de Acceso</h3>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      placeholder="usuario123"
                      {...register('username')}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500">{errors.username.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      >
                        <span className="text-muted-foreground">
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </span>
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      >
                        <span className="text-muted-foreground">
                          {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </span>
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Usuario Activo</Label>
                      <p className="text-sm text-muted-foreground">
                        El usuario podrá acceder al sistema
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formValues.isActive}
                      onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
                    />
                  </div>

                  {/* Role Preview */}
                  {selectedRole && (
                    <div className="mt-4 rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium">Permisos del Rol</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedRole.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
}
