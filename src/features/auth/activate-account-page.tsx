import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
} from "@/components/ui";
import { AuthLayout } from "@/app/layout";
import { userService } from "@/services/Auth/User";
import { toast } from "@/hooks";

const resendSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type ResendFormData = z.infer<typeof resendSchema>;

export function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [activationState, setActivationState] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [activationMsg, setActivationMsg] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: "",
    },
  });

  const activateAccount = async () => {
    if (!token) return;
    setIsActivating(true);
    try {
      const resp = await userService.activateAccount({ token });
      if (resp.code === 200) {
        setActivationState("success");
        setActivationMsg(
          resp.data?.message ?? "Tu cuenta fue activada correctamente."
        );
      } else {
        setActivationState("error");
        setActivationMsg(
          Array.isArray(resp.data)
            ? resp.data.join(", ")
            : resp.msg || "No se pudo activar la cuenta."
        );
      }
    } catch {
      setActivationState("error");
      setActivationMsg("No se pudo conectar con el servidor.");
    } finally {
      setIsActivating(false);
    }
  };

  const onResend = async (data: ResendFormData) => {
    setIsResending(true);
    try {
      const resp = await userService.resendActivation({ email: data.email });
      if (resp.code === 200) {
        toast({
          variant: "success",
          title: "✅ Enlace reenviado",
          description:
            resp.data?.message ??
            "Si el correo está registrado y pendiente de activación, recibirás un nuevo enlace.",
        });
      } else {
        toast({
          variant: "warning",
          title: "❌ Error al reenviar",
          description: Array.isArray(resp.data)
            ? resp.data.join(", ")
            : resp.msg || "Ocurrió un error al reenviar el enlace.",
        });
      }
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al reenviar",
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📧</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Activar cuenta</CardTitle>
          <CardDescription>
            Confirma tu correo para empezar a usar Restaurant Management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {activationState === "success" ? (
            <div className="space-y-4">
              <p className="text-center text-sm font-medium text-green-600">
                {activationMsg}
              </p>
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Link to="/login">Ir a iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              {token ? (
                <p className="text-center text-sm text-neutral-600">
                  Pulsa el botón para activar tu cuenta.
                </p>
              ) : (
                <p className="text-center text-sm text-red-500">
                  No se encontró un token de activación en el enlace.
                </p>
              )}

              {activationState === "error" && (
                <p className="text-center text-sm text-red-500">
                  {activationMsg}
                </p>
              )}

              <Button
                type="button"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={activateAccount}
                disabled={!token || isActivating}
              >
                {isActivating ? "Activando cuenta..." : "Activar cuenta"}
              </Button>

              <div className="space-y-3 border-t pt-5">
                <p className="text-sm font-medium">
                  ¿No llegó el correo o el enlace expiró?
                </p>
                <form
                  onSubmit={handleSubmit(onResend)}
                  className="space-y-2"
                >
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@empresa.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={isResending}
                  >
                    {isResending
                      ? "Reenviando..."
                      : "Reenviar enlace de activación"}
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex-col space-y-0">
          <p className="text-center text-sm text-neutral-600">
            ¿Ya tienes tu cuenta activada?{" "}
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
