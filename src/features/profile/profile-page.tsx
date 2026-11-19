import * as React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  ChangePasswordCard,
  ProfileCard,
  ProfileFormDialog,
  type ProfileFormData,
} from '@/components/profile';
import { Button, Card, CardContent, Skeleton } from '@/components/ui';
import { toast } from '@/hooks';
import { authService } from '@/services';
import { useAuthStore } from '@/store';
import type { ApiResponse, AuthProfile } from '@/types';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/**
 * Mi perfil (`/perfil`): datos del usuario con perfil/empresa/sede
 * resueltos (`GET /auth/profile`), edición de nombre/correo/teléfono y
 * cambio de contraseña — todo de autoservicio, sin depender del módulo
 * Usuarios.
 *
 * Usa el mismo layout que el resto de la app (`ConfigLayout` + `ConfigSidebar`,
 * el sidebar real cargado del menú del perfil).
 */
export function ProfilePage() {
  const [profile, setProfile] = React.useState<AuthProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await authService.getProfile();
      if (resp.code === 200 && resp.data) {
        setProfile(resp.data);
      } else {
        toast({
          variant: 'warning',
          title: 'No se pudo cargar tu perfil',
          description: apiErrorMessage(resp, 'Intenta de nuevo en unos segundos.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: 'No se pudo cargar tu perfil',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /** Deja el store de sesión al día con lo recién guardado (nombre/correo). */
  const syncSession = (updated: AuthProfile) => {
    const { accessToken, user } = useAuthStore.getState();
    if (accessToken && user) {
      useAuthStore.getState().setSession(accessToken, {
        ...user,
        name: updated.name,
        email: updated.email,
      });
    }
  };

  const handleSaveProfile = async (values: ProfileFormData): Promise<void> => {
    let resp: ApiResponse<AuthProfile>;
    try {
      resp = await authService.updateProfile(values);
    } catch {
      toast({
        variant: 'warning',
        title: 'Sin conexión',
        description: 'No se pudo contactar con el servidor.',
      });
      throw new Error('network');
    }

    if (resp.code === 200 && resp.data) {
      setProfile(resp.data);
      syncSession(resp.data);
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos se guardaron correctamente.',
      });
      return;
    }

    toast({
      variant: 'warning',
      title: 'No se pudo guardar',
      description: apiErrorMessage(resp, 'Revisa los datos e intenta de nuevo.'),
    });
    throw new Error('save-failed');
  };

  const handleChangePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    let resp: ApiResponse<{ message: string }>;
    try {
      resp = await authService.changePassword(payload);
    } catch {
      toast({
        variant: 'warning',
        title: 'Sin conexión',
        description: 'No se pudo contactar con el servidor.',
      });
      throw new Error('network');
    }

    if (resp.code === 200) {
      toast({
        title: 'Contraseña actualizada',
        description: 'Usa la nueva contraseña en tu próximo inicio de sesión.',
      });
      return;
    }

    toast({
      variant: 'warning',
      title: 'No se pudo cambiar la contraseña',
      description: apiErrorMessage(resp, 'Verifica los datos e intenta de nuevo.'),
    });
    throw new Error('password-failed');
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Encabezado al estilo del resto de las páginas */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tus datos, tu sede y la seguridad de tu cuenta
            </p>
          </div>

          {loading && !profile && (
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          )}

          {!loading && !profile && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">No se pudieron cargar tus datos</p>
                  <p className="text-sm text-muted-foreground">
                    Revisa tu conexión e intenta de nuevo.
                  </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => void loadProfile()}>
                  <RotateCcw className="h-4 w-4" />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {profile && (
            <>
              <ProfileCard profile={profile} onEdit={() => setEditOpen(true)} />
              <ChangePasswordCard onSubmit={handleChangePassword} />

              <ProfileFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                profile={profile}
                onSubmit={handleSaveProfile}
              />
            </>
          )}
        </div>
      }
    />
  );
}
