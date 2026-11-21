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
import { authService, locationService } from "@/services";
import type {
  City,
  Country,
  Departament,
  RegisterPayload,
} from "@/types";
import { toast } from "@/hooks";
import { useEffect, useState } from "react";

const registerSchema = z
  .object({
    userName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    userEmail: z.string().email("Correo electrónico inválido"),
    phoneUser: z.string().min(1, "El teléfono es requerido"),
    companyName: z.string().min(1, "El nombre del negocio es requerido"),
    countryId: z.string().min(1, "Debes seleccionar un país"),
    departmentId: z.string().min(1, "Debes seleccionar un departamento"),
    cityId: z.string().min(1, "Debes seleccionar una ciudad"),
    address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar la contraseña"),
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
      userName: "",
      userEmail: "",
      phoneUser: "",
      companyName: "",
      countryId: "",
      departmentId: "",
      cityId: "",
      address: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [departments, setDepartments] = useState<Departament[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    getCountries();
  }, []);

  const getCountries = async () => {
    try {
      const resp = await locationService.listCountries();
      setCountries(resp);
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al cargar",
        description: "No se pudo obtener el listado de países.",
      });
    }
  };

  const onChangeCountry = async (countryId: string) => {
    setValue("countryId", countryId);
    setValue("departmentId", "");
    setValue("cityId", "");
    setDepartments([]);
    setCities([]);
    if (countryId) {
      const respDepartments = await locationService.listDepartaments(
        Number(countryId)
      );
      setDepartments(respDepartments);
    }
  };

  const onChangeDepartment = async (departmentId: string) => {
    setValue("departmentId", departmentId);
    setValue("cityId", "");
    setCities([]);
    if (departmentId) {
      const respCities = await locationService.listCities(Number(departmentId));
      setCities(respCities);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormData) => {
    const payload: RegisterPayload = {
      name: data.userName,
      email: data.userEmail,
      password: data.password,
      telephone: data.phoneUser,
      companyName: data.companyName,
      companyAddress: data.address,
      countryId: Number(data.countryId),
      departamentId: Number(data.departmentId),
      cityId: Number(data.cityId),
    };

    try {
      const resp = await authService.register(payload);
      if (resp.code === 201) {
        toast({
          variant: "success",
          title: "✅ Registro realizado correctamente",
          description: "Revisa tu correo para activar tu cuenta.",
        });
        navigate("/login");
      } else {
        toast({
          variant: "warning",
          title: "❌ Error al registrar",
          description: Array.isArray(resp.data)
            ? resp.data.join(", ")
            : resp.msg || "Ocurrió un error al registrar la cuenta.",
        });
      }
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al registrar",
        description: "No se pudo conectar con el servidor.",
      });
    }
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
          <CardDescription>Regístrate en RestoBar Manager</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <CardTitle className="text-xl">Datos de usuario</CardTitle>
            {/* Fila 1: Nombre y Email */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="userName">Nombre completo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    👤
                  </span>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Juan Pérez"
                    className="pl-10"
                    {...register("userName")}
                  />
                </div>
                {errors.userName && (
                  <p className="text-xs text-red-500">
                    {errors.userName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="phoneUser">Teléfono</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    📱
                  </span>
                  <Input
                    id="phoneUser"
                    type="tel"
                    placeholder="3214587890"
                    className="pl-10"
                    {...register("phoneUser")}
                  />
                </div>
                {errors.phoneUser && (
                  <p className="text-xs text-red-500">
                    {errors.phoneUser.message}
                  </p>
                )}
              </div>
            </div>
            {/* Fila 2: Teléfono y País */}
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="userEmail">Correo electrónico</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    📧
                  </span>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="ejemplo@empresa.com"
                    className="pl-10"
                    {...register("userEmail")}
                  />
                </div>
                {errors.userEmail && (
                  <p className="text-xs text-red-500">
                    {errors.userEmail.message}
                  </p>
                )}
              </div>
            </div>
            {/* Fila 3: Departamento y Ciudad */}
            <CardTitle className="text-xl">Datos del negocio</CardTitle>
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="companyName">Nombre del negocio</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    👤
                  </span>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nombre del negocio"
                    className="pl-10"
                    {...register("companyName")}
                  />
                </div>
                {errors.companyName && (
                  <p className="text-xs text-red-500">
                    {errors.companyName.message}
                  </p>
                )}
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
                    {countries.map((country) => (
                      <SelectItem
                        key={country.id}
                        value={country.id.toString()}
                      >
                        {country.name}
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
                    {departments.map((department) => (
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
                    {cities.map((city) => (
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
            <div className="flex flex-col md:flex-row gap-5">
              <div className="space-y-2 flex-1">
                <Label htmlFor="address">Dirección</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    🏠
                  </span>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Dirección del negocio"
                    className="pl-10"
                    {...register("address")}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-500">
                    {errors.address.message}
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
