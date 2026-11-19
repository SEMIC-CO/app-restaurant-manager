import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '@/components/ui';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import { toast } from '@/hooks';
import {
  headquarterService,
  profileService,
  userService,
} from '@/services';
import { useAuthStore } from '@/store';
import { Loader2, ArrowLeft, UserPlus, Save } from 'lucide-react';

/** Selector de Radix no admite `value=""`: se usa esta marca para "sin sede". */
const NO_VALUE = 'none';

const buildUserSchema = (isEditing: boolean) => {
  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(255, 'El nombre no puede superar los 255 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'El correo es obligatorio')
      .max(255, 'El correo no puede superar los 255 caracteres')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo electrónico inválido'),
    telephone: z
      .string()
      .max(15, 'El teléfono no puede superar los 15 caracteres'),
    profileId: z
      .number({ message: 'Selecciona un perfil' })
      .min(1, 'Selecciona un perfil'),
    headquarterId: z
      .number({ message: 'Selecciona una sede' })
      .min(1, 'Selecciona una sede'),
    // En creación es obligatoria (backend: 8–60); en edición, vacío = no cambiar.
    password: z.string(),
    confirmPassword: z.string(),
  });

  return schema
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    })
    .refine(
      (data) =>
        (isEditing && data.password === '') || data.password.length >= 8,
      {
        message: 'La contraseña debe tener al menos 8 caracteres',
        path: ['password'],
      },
    )
    .refine((data) => data.password.length <= 60, {
      message: 'La contraseña no puede superar los 60 caracteres',
      path: ['password'],
    });
};

type UserFormData = z.infer<ReturnType<typeof buildUserSchema>>;

/**
 * Crea (`/configuracion/usuarios/nuevo`) o edita
 * (`/configuracion/usuarios/editar/:userId`) un usuario real del backend.
 *
 * Reemplaza los roles hardcodeados: el **perfil** viene de `GET /profiles` y
 * la **sede** de `GET /headquarters` (ambas obligatorias en `CreateUserDto`).
 * En edición la contraseña es opcional: si se deja vacía no cambia.
 */
export function UserCreatePage() {
  const navigate = useNavigate();
  const params = useParams<{ userId: string }>();
  const userId = params.userId ? Number(params.userId) : null;
  const isEditing = userId !== null && Number.isInteger(userId) && userId > 0;

  const sessionHeadquarterId = useAuthStore(
    (state) => state.user?.headquarterId ?? null,
  );

  const [profiles, setProfiles] = React.useState<
    Array<{ id: number; profile: string; type: string }>
  >([]);
  const [headquarters, setHeadquarters] = React.useState<
    Array<{ id: number; name: string }>
  >([]);
  const [loadingLookups, setLoadingLookups] = React.useState(true);
  const [loadingUser, setLoadingUser] = React.useState(isEditing);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [showPassword, setShowPassword] = React.useState(false);

  const isEditingRef = React.useRef(isEditing);
  const schema = React.useMemo(
    () => buildUserSchema(isEditingRef.current),
    [],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      telephone: '',
      profileId: 0,
      headquarterId: sessionHeadquarterId ?? 0,
      password: '',
      confirmPassword: '',
    },
  });

  const profileId = useWatch({ control, name: 'profileId' });
  const headquarterId = useWatch({ control, name: 'headquarterId' });

  // Catálogos de perfil y sede.
  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [profilesResp, headquartersResp] = await Promise.all([
          profileService.list(),
          headquarterService.list({ page: 1, limit: 100 }),
        ]);
        if (!active) return;
        if (profilesResp.code === 200) setProfiles(profilesResp.data);
        if (headquartersResp.code === 200) {
          setHeadquarters(headquartersResp.data.items);
        }
      } catch {
        if (active) {
          setLoadError('No se pudieron cargar los perfiles ni las sedes.');
        }
      } finally {
        if (active) setLoadingLookups(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Precarga en modo edición.
  React.useEffect(() => {
    if (!isEditing || userId === null) return;
    let active = true;
    void (async () => {
      try {
        const resp = await userService.getById(userId);
        if (!active) return;
        if (resp.code !== 200) {
          setLoadError(
            (Array.isArray(resp.data) ? resp.data.join(', ') : resp.msg) ||
              'No se pudo cargar el usuario.',
          );
          return;
        }
        reset({
          name: resp.data.name,
          email: resp.data.email,
          telephone: resp.data.telephone ?? '',
          profileId: resp.data.profileId,
          headquarterId: resp.data.headquarterId ?? 0,
          password: '',
          confirmPassword: '',
        });
      } catch {
        if (active) setLoadError('No se pudo conectar con el servidor.');
      } finally {
        if (active) setLoadingUser(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEditing, userId, reset]);

  const onSubmit = async (data: UserFormData) => {
    let savedId = userId;

    if (isEditing && userId !== null) {
      const resp = await userService.update(userId, {
        name: data.name.trim(),
        email: data.email.trim(),
        telephone: data.telephone.trim() || undefined,
        profileId: data.profileId,
        headquarterId: data.headquarterId,
      });

      if (resp.code !== 200) {
        const message =
          (Array.isArray(resp.data) ? resp.data.join(', ') : resp.msg) ||
          'Ocurrió un error al guardar el usuario.';
        toast({
          variant: 'warning',
          title: '❌ Error al actualizar',
          description: message,
        });
        throw new Error(message);
      }

      // Contraseña opcional: si se dejó vacía, no se toca.
      if (data.password !== '') {
        const passResp = await userService.updatePassword(userId, data.password);
        if (passResp.code !== 200) {
          const message =
            (Array.isArray(passResp.data)
              ? passResp.data.join(', ')
              : passResp.msg) || 'No se pudo cambiar la contraseña.';
          toast({
            variant: 'warning',
            title: '❌ Contraseña no actualizada',
            description: message,
          });
          throw new Error(message);
        }
      }

      toast({
        variant: 'success',
        title: '✅ Usuario actualizado',
        description: 'Los datos del usuario se han actualizado correctamente.',
      });
    } else {
      const resp = await userService.create({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        telephone: data.telephone.trim() || undefined,
        profileId: data.profileId,
        headquarterId: data.headquarterId,
      });

      if (resp.code !== 200 && resp.code !== 201) {
        const message =
          (Array.isArray(resp.data) ? resp.data.join(', ') : resp.msg) ||
          'Ocurrió un error al crear el usuario.';
        toast({
          variant: 'warning',
          title: '❌ Error al crear',
          description: message,
        });
        throw new Error(message);
      }

      savedId = resp.data.id;
      toast({
        variant: 'success',
        title: '✅ Usuario creado',
        description: `El usuario "${resp.data.name}" se ha creado correctamente.`,
      });
    }

    navigate('/configuracion/usuarios');
    return savedId;
  };

  const handleCancel = () => {
    navigate('/configuracion/usuarios');
  };

  const busy = loadingLookups || loadingUser;
  const noProfiles = !loadingLookups && profiles.length === 0;

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="cursor-pointer hover:text-foreground"
                  onClick={handleCancel}
                >
                  Usuarios
                </span>
                <span>/</span>
                <span className="text-foreground">
                  {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </span>
              </div>
            </div>
            <div className="ml-14">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEditing
                  ? 'Actualiza los datos, el perfil o la sede del usuario'
                  : 'Agrega un usuario al sistema y asíignale su perfil y su sede'}
              </p>
            </div>
          </div>

          {loadError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4 text-sm text-destructive">
                {loadError}
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column - Personal Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Información Personal</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nombre Completo *</Label>
                    <Input
                      id="user-name"
                      placeholder="Juan Pérez"
                      maxLength={255}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email">Correo Electrónico *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="juan@ejemplo.com"
                      maxLength={255}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-phone">Teléfono</Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      placeholder="3001112233"
                      maxLength={15}
                      {...register('telephone')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hasta 15 dígitos (lo que acepta el backend).
                    </p>
                    {errors.telephone && (
                      <p className="text-xs text-red-500">
                        {errors.telephone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-profile">Perfil *</Label>
                    <Select
                      value={profileId > 0 ? String(profileId) : NO_VALUE}
                      onValueChange={(value) =>
                        setValue('profileId', Number(value), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger id="user-profile" disabled={busy}>
                        <SelectValue placeholder="Selecciona un perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={String(profile.id)}>
                            <span className="flex items-center gap-2">
                              {profile.profile}
                              {profile.type === 'SYSTEM' && (
                                <span className="text-xs text-muted-foreground">
                                  (sistema)
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.profileId && (
                      <p className="text-xs text-red-500">
                        {errors.profileId.message}
                      </p>
                    )}
                    {noProfiles && (
                      <p className="text-xs text-red-500">
                        No hay perfiles: créalos antes en Configuración →
                        Perfiles.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-headquarter">Sede *</Label>
                    <Select
                      value={headquarterId > 0 ? String(headquarterId) : NO_VALUE}
                      onValueChange={(value) =>
                        setValue('headquarterId', Number(value), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger id="user-headquarter" disabled={busy}>
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                      <SelectContent>
                        {headquarters.map((headquarter) => (
                          <SelectItem
                            key={headquarter.id}
                            value={String(headquarter.id)}
                          >
                            {headquarter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.headquarterId && (
                      <p className="text-xs text-red-500">
                        {errors.headquarterId.message}
                      </p>
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

                  <div className="space-y-2">
                    <Label htmlFor="user-password">
                      Contraseña {isEditing ? '' : '*'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={
                          isEditing ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'
                        }
                        autoComplete="new-password"
                        maxLength={60}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isEditing
                        ? 'Si la dejas vacía, el usuario conserva su contraseña actual.'
                        : 'Mínimo 8 caracteres (lo que exige el backend).'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-confirm-password">
                      Confirmar Contraseña {isEditing ? '' : '*'}
                    </Label>
                    <Input
                      id="user-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      autoComplete="new-password"
                      maxLength={60}
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions: mismo pie de formulario que el resto de módulos */}
            <div className="mt-6 flex justify-end gap-4 border-t pt-6">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || busy || noProfiles}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear usuario
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
}
