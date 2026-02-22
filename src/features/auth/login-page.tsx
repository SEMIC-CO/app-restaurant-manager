import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Label, Checkbox } from '@/components/ui';
import { AuthLayout } from '@/app/layout';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    // TODO: Implement login logic
    console.log('Login data:', data);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <AuthLayout>
      <Card className="shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🍴</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>Ingresa a tu cuenta de Empanada Manager</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                📧
              </span>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                className="pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                🔒
              </span>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
              >
                <span className="text-neutral-400 hover:text-neutral-600">
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked: boolean) => setValue('rememberMe', checked)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Recordarme
              </Label>
            </div>
            <Link
              to="/recuperar-contrasena"
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'} →
          </Button>
        </CardContent>
        </form>
        
        <CardFooter className="flex-col space-y-0">
          <p className="text-center text-sm text-neutral-600">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/registro"
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Solicita acceso
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
