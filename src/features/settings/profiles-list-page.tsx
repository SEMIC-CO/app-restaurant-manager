import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  ConfirmDialog,
  ConfirmHighlight,
  ProfileFormDialog,
  type ProfileFormData,
} from '@/components/common';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
} from '@/components/ui';
import { toast } from '@/hooks';
import { profileService } from '@/services';
import { cn } from '@/lib/utils';
import type { ApiProfile, ApiResponse } from '@/types';
import { IdCard, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/**
 * Perfiles de usuario: alta, edición y borrado. Los perfiles SYSTEM los creó
 * la plataforma y se muestran en **solo lectura** (el backend responde `403`
 * si se intenta modificar o borrar), y los COMPANY son los de la empresa.
 *
 * Alcance empresa del JWT: `GET /profiles` devuelve SYSTEM + los propios.
 */
export function ProfilesListPage() {
  const [profiles, setProfiles] = React.useState<ApiProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiProfile | null>(null);
  const [deleting, setDeleting] = React.useState<ApiProfile | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await profileService.list();
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar perfiles',
          description: apiErrorMessage(resp, 'No se pudieron cargar los perfiles.'),
        });
        return;
      }
      setProfiles(resp.data);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar perfiles',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const term = searchQuery.trim().toLowerCase();
  const filtered = term
    ? profiles.filter((profile) => profile.profile.toLowerCase().includes(term))
    : profiles;

  const systemCount = profiles.filter((profile) => profile.type === 'SYSTEM').length;
  const companyCount = profiles.length - systemCount;

  const handleCreate = () => {
    setEditing(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (profile: ApiProfile) => {
    setEditing(profile);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    const isEdit = Boolean(editing);

    // Defensa en profundidad: aunque los botones salen deshabilitados, los
    // perfiles del sistema no se envían al backend (respondería 403).
    if (isEdit && editing?.type === 'SYSTEM') {
      const message = 'Los perfiles del sistema no se pueden modificar.';
      toast({ variant: 'warning', title: '🔒 Perfil de sistema', description: message });
      throw new Error(message);
    }

    const resp =
      isEdit && editing
        ? await profileService.update(editing.id, { profile: data.profile })
        : await profileService.create({ profile: data.profile });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Perfil actualizado' : '✅ Perfil creado',
        description: isEdit
          ? 'El perfil se ha actualizado correctamente.'
          : `El perfil "${resp.data.profile}" se ha creado correctamente.`,
      });
      await load();
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar el perfil.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar' : '❌ Error al crear',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    // Mismo guard que en la edición: el backend responde 403 para SYSTEM.
    // Aquí no hay nada que reintentar, así que se cierra el popup y se avisa.
    if (deleting.type === 'SYSTEM') {
      toast({
        variant: 'warning',
        title: '🔒 Perfil de sistema',
        description: 'Los perfiles del sistema no se pueden eliminar.',
      });
      setDeleting(null);
      return;
    }

    const resp = await profileService.remove(deleting.id);
    if (resp.code === 200 || resp.code === 204) {
      toast({
        variant: 'success',
        title: '✅ Perfil eliminado',
        description: `El perfil "${deleting.profile}" se ha eliminado correctamente.`,
      });
      setDeleting(null);
      await load();
    } else {
      const message = apiErrorMessage(resp, 'No se pudo eliminar el perfil.');
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar',
        description: message,
      });
      // Lanza para que el popup permanezca abierto (p. ej. 409: usuarios asignados)
      throw new Error(message);
    }
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Perfiles</h1>
              <p className="mt-1 text-muted-foreground">
                Agrupa los permisos de tus usuarios. Elige un perfil al crear
                a cada usuario.
              </p>
            </div>
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Nuevo perfil
            </Button>
          </div>

          {/* Resumen */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Perfiles totales
                </p>
                <p className="mt-1 text-2xl font-semibold">{profiles.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  De la empresa
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                  {companyCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Del sistema
                </p>
                <p className="mt-1 text-2xl font-semibold text-muted-foreground">
                  {systemCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Listado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Perfiles registrados
                </CardTitle>
                <CardDescription>
                  Los perfiles del sistema no se pueden modificar ni eliminar
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Buscar perfil..."
                  className="h-9 w-[200px] pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Perfil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          Cargando perfiles...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center">
                          <p className="font-medium">
                            {term ? 'Sin coincidencias' : 'Sin perfiles registrados'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {term
                              ? 'Prueba con otro término de búsqueda.'
                              : 'Usa el botón "Nuevo perfil" para crear el primero.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((profile) => {
                        const isSystem = profile.type === 'SYSTEM';
                        return (
                          <tr key={profile.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <span className="flex items-center gap-2 text-sm font-medium">
                                {profile.profile}
                                {isSystem && (
                                  <Lock
                                    className="h-3.5 w-3.5 text-muted-foreground"
                                    aria-hidden="true"
                                  />
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[11px] uppercase',
                                  isSystem
                                    ? 'text-muted-foreground'
                                    : 'bg-green-500/10 text-green-700 dark:text-green-400',
                                )}
                              >
                                {isSystem ? 'Sistema' : 'Empresa'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {isSystem ? (
                                /* Sin botones: `disabled` bloquea el puntero y el
                                   `title` nunca llegaría a mostrarse, así que la
                                   restricción se explica de forma visible. */
                                <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                  Solo lectura
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(profile)}
                                    className="h-8 w-8"
                                    title="Editar perfil"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleting(profile)}
                                    className="h-8 w-8 hover:text-destructive"
                                    title="Eliminar perfil"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <ProfileFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            profile={editing ?? undefined}
            onSubmit={handleSubmit}
          />

          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
            title="Eliminar perfil"
            description={
              <>
                Se eliminará el perfil{' '}
                <ConfirmHighlight>{deleting?.profile}</ConfirmHighlight>. No se
                puede deshacer, y fallará si el perfil tiene usuarios asignados.
              </>
            }
            confirmLabel="Eliminar"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </div>
      }
    />
  );
}
