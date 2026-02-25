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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { AuthLayout } from "@/app/layout";
import { userService } from "@/services/Auth/User";
import { toast } from "@/hooks";
import { useEffect, useState } from "react";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    phone: z.string().optional(),
    countryId: z.string().min(1, "Debes seleccionar un país"),
    departmentId: z.string().min(1, "Debes seleccionar un departamento"),
    cityId: z.string().min(1, "Debes seleccionar una ciudad"),
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
      countryId: "",
      departmentId: "",
      cityId: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    getCountries();
  }, []);

  const getCountries = async () => {
    const resp = await userService.getCountries();
    if (resp.responseCode === 200) {
      setCountries(resp.data);
    }
  };

  const onChangeCountry = async (countryId: string) => {
    setValue("countryId", countryId);
    setValue("departmentId", "");
    setValue("cityId", "");
    setDepartments([]);
    setCities([]);
    if (countryId) {
      const respDepartments = await userService.getDepartments(countryId);
      if (respDepartments.responseCode === 200) {
        setDepartments(respDepartments.data);
      }
    }
  };

  const onChangeDepartment = async (departmentId: string) => {
    setValue("departmentId", departmentId);
    setValue("cityId", "");
    setCities([]);
    if (departmentId) {
      const respCities = await userService.getCities(departmentId);
      if (respCities.responseCode === 200) {
        setCities(respCities.data);
      }
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            {/* Fila 1: Nombre y Email */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
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

              <div className="space-y-2 flex-1">
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
            </div>

            {/* Fila 2: Teléfono y País */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="phone">
                  Teléfono{" "}
                  <span className="text-neutral-400 font-normal">
                    (opcional)
                  </span>
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

              <div className="space-y-2 flex-1">
                <Label htmlFor="country">País</Label>
                <Select
                  value={watch("countryId") || undefined}
                  onValueChange={(value) => onChangeCountry(value)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: any) => (
                      <SelectItem
                        key={country.id}
                        value={country.id.toString()}
                      >
                        {country.countrie}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryId && (
                  <p className="text-xs text-red-500">
                    {errors.countryId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fila 3: Departamento y Ciudad */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={watch("departmentId") || undefined}
                  onValueChange={(value) => onChangeDepartment(value)}
                  disabled={!watch("countryId") || departments.length === 0}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department: any) => (
                      <SelectItem
                        key={department.id}
                        value={department.id.toString()}
                      >
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-xs text-red-500">
                    {errors.departmentId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="city">Ciudad</Label>
                <Select
                  value={watch("cityId") || undefined}
                  onValueChange={(value) => setValue("cityId", value)}
                  disabled={!watch("departmentId") || cities.length === 0}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cityId && (
                  <p className="text-xs text-red-500">
                    {errors.cityId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fila 4: Contraseña y Confirmar Contraseña */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
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

              <div className="space-y-2 flex-1">
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
