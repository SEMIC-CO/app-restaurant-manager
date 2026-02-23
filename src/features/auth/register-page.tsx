import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from "@/components/ui";
import { AuthLayout } from "@/app/layout";
import { userService } from "@/services/Auth/User";
import { toast } from "@/hooks";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormData) => {
    // TODO: Implement register logic
    console.log("Register data:", data);
    toast({
      variant: "success",
      title: "✅ Producto guardado",
      description: "El producto se ha creado correctamente.",
    });
    const resp = await userService.registerUser(data);
    console.log(resp);

    // setTimeout(() => {
    //   navigate('/login');
    // }, 1000);
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
          <CardTitle className="text-2xl">Crear cuenta nueva</CardTitle>
          <CardDescription>Regístrate en Empanada Manager</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  👤
                </span>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  className="pl-10"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

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
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono{" "}
                <span className="text-neutral-400 font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  📱
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+52 123 456 7890"
                  className="pl-10"
                  {...register("phone")}
                />
              </div>
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                >
                  <span className="text-neutral-400 hover:text-neutral-600">
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  🔒
                </span>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                >
                  <span className="text-neutral-400 hover:text-neutral-600">
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked: boolean) =>
                  setValue("acceptTerms", checked)
                }
              />
              <Label
                htmlFor="terms"
                className="text-xs font-normal leading-tight cursor-pointer"
              >
                Al registrarte, aceptas nuestros{" "}
                <Link
                  to="/terminos"
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Términos de Servicio
                </Link>{" "}
                y{" "}
                <Link
                  to="/privacidad"
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Política de Privacidad
                </Link>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500">
                {errors.acceptTerms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"} →
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex-col space-y-0">
          <p className="text-center text-sm text-neutral-600">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
