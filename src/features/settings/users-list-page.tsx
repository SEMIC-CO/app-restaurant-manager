import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar, ConfirmDialog, ConfirmHighlight } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Switch,
} from '@/components/ui';
import { toast } from '@/hooks';
import { headquarterService, profileService, userService } from '@/services';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import type { ApiUser, ApiResponse, Paginated } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

const USERS_PAGE_SIZE = 10;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/** `users` no trae el nombre de la sede/perfil: se resuelve con estos mapas. */
function buildNameMap(items: Array<{ id: number; name?: string; profile?: string }>) {
  const map = new Map<number, string>();
  for (const item of items) {
    const label = 'name' in item ? item.name : item.profile;
    if (label) map.set(item.id, label);
  }
  return map;
}

/**
 * Usuarios de la empresa (API real): paginados, con búsqueda por nombre o
 * correo. El perfil y la sede llegan como ids (`profileId`/`headquarterId`),
 * así que se cruzan con `GET /profiles` y `GET /headquarters` para mostrar
 * sus nombres.
 */
export function UsersListPage() {
  const navigate = useNavigate();

  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [deleting, setDeleting] = React.useState<ApiUser | null>(null);
  /** Id del usuario cuyo estado se está cambiando (para deshabilitar el switch). */
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  /** No se puede desactivarse a uno mismo (el backend responde 403). */
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const profileNames = React.useRef(new Map<number, string>());
  const headquarterNames = React.useRef(new Map<number, string>());
  const [lookupsLoaded, setLookupsLoaded] = React.useState(false);

  const isFirstSearchRender = React.useRef(true);

  // Catálogos para los nombres de perfil y sede (una sola vez).
  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [profilesResp, headquartersResp] = await Promise.all([
          profileService.list(),
          headquarterService.list({ page: 1, limit: 100 }),
        ]);
        if (!active) return;
        if (profilesResp.code === 200) {
          profileNames.current = buildNameMap(profilesResp.data);
        }
        if (headquartersResp.code === 200) {
          headquarterNames.current = buildNameMap(headquartersResp.data.items);
        }
      } catch {
        // Sin catálogos la lista sigue funcionando: solo se pierden los nombres.
      } finally {
        if (active) setLookupsLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const load = React.useCallback(
    async (targetPage: number, term: string) => {
      setLoading(true);
      try {
        const resp = await userService.list({
          page: targetPage,
          limit: USERS_PAGE_SIZE,
          search: term.trim() || undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar usuarios',
            description: apiErrorMessage(resp, 'No se pudieron cargar los usuarios.'),
          });
          return;
        }
        const data: Paginated<ApiUser> = resp.data;
        setUsers(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar usuarios',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load(1, '');
  }, [load]);

  // Búsqueda con debounce (siempre desde la página 1).
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, load]);

  const goToPage = (targetPage: number) => {
    setPage(targetPage);
    void load(targetPage, searchQuery);
  };

  const activeCount = users.filter((user) => user.status === 'ACTIVO').length;
  const ownerCount = users.filter((user) => user.isOwner).length;

  /**
   * Activa/desactiva la cuenta (`users.status`). El estado local solo se
   * actualiza cuando el backend responde bien, así que no hace falta revertir.
   * El backend rechaza desactivarte a ti mismo (`403`).
   */
  const handleToggleStatus = async (user: ApiUser) => {
    const nextStatus = user.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setTogglingId(user.id);
    try {
      const resp = await userService.update(user.id, { status: nextStatus });
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ No se pudo cambiar el estado',
          description: apiErrorMessage(
            resp,
            'No se pudo actualizar el estado del usuario.',
          ),
        });
        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, status: resp.data.status } : item,
        ),
      );
      toast({
        variant: 'success',
        title: nextStatus === 'ACTIVO' ? '✅ Usuario activado' : '✅ Usuario desactivado',
        description:
          nextStatus === 'ACTIVO'
            ? `${user.name} ya puede iniciar sesión.`
            : `${user.name} ya no podrá iniciar sesión.`,
      });
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo cambiar el estado',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const resp = await userService.remove(deleting.id);
    if (resp.code === 200 || resp.code === 204) {
      toast({
        variant: 'success',
        title: '✅ Usuario eliminado',
        description: `El usuario "${deleting.name}" se ha eliminado correctamente.`,
      });
      setDeleting(null);
      await load(page, searchQuery);
    } else {
      const message = apiErrorMessage(resp, 'No se pudo eliminar el usuario.');
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar',
        description: message,
      });
      // Lanza para que el popup permanezca abierto (403: propio/propietario)
      throw new Error(message);
    }
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header: la misma barra (con su padding) que el resto de módulos */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Usuarios</h1>
                <p className="mt-1 text-muted-foreground">
                  Cuentas que acceden al sistema, cada una con su perfil y su
                  sede.
                </p>
              </div>
              <Button className="gap-2" onClick={() => navigate('/configuracion/usuarios/nuevo')}>
                <Plus className="h-4 w-4" />
                Nuevo usuario
              </Button>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total usuarios
                </p>
                <p className="mt-1 text-2xl font-semibold">{total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Activos (en página)
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                  {activeCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Propietarios
                </p>
                <p className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {ownerCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Listado */}
          <Card>
            <div className="flex flex-row items-center justify-between gap-3 border-b px-6 py-4">
              <p className="text-sm font-medium">Usuarios registrados</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre o correo..."
                  className="h-9 w-[260px] pl-9"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Sede
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <p className="font-medium">
                          {searchQuery.trim() ? 'Sin coincidencias' : 'Sin usuarios registrados'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {searchQuery.trim()
                            ? 'Prueba con otro nombre o correo.'
                            : 'Usa "Nuevo usuario" para crear la primera cuenta.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      return (
                        <tr key={user.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              {user.name}
                              {user.isOwner && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-500/10 text-[10px] uppercase text-purple-700 dark:text-purple-400"
                                >
                                  Propietario
                                </Badge>
                              )}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {user.email}
                              {user.telephone ? ` · ${user.telephone}` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {lookupsLoaded &&
                            profileNames.current.has(user.profileId) ? (
                              profileNames.current.get(user.profileId)
                            ) : (
                              <span className="text-muted-foreground">
                                Perfil #{user.profileId}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {user.headquarterId !== null &&
                            headquarterNames.current.has(user.headquarterId) ? (
                              headquarterNames.current.get(user.headquarterId)
                            ) : (
                              <span className="text-muted-foreground">
                                {user.headquarterId === null
                                  ? '—'
                                  : `Sede #${user.headquarterId}`}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.status === 'ACTIVO'}
                                disabled={
                                  togglingId === user.id ||
                                  user.isOwner ||
                                  user.id === currentUserId
                                }
                                onCheckedChange={() => void handleToggleStatus(user)}
                                aria-label={
                                  user.status === 'ACTIVO'
                                    ? `Desactivar a ${user.name}`
                                    : `Activar a ${user.name}`
                                }
                              />
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  user.status === 'ACTIVO'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-muted-foreground',
                                )}
                                title={
                                  user.isOwner
                                    ? 'No se puede desactivar al propietario'
                                    : user.id === currentUserId
                                      ? 'No puedes desactivarte a ti mismo'
                                      : undefined
                                }
                              >
                                {user.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            {(user.isOwner || user.id === currentUserId) && (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {user.isOwner
                                  ? 'Propietario, no se desactiva'
                                  : 'Tu cuenta'}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(`/configuracion/usuarios/editar/${user.id}`)
                                }
                                className="h-8 w-8"
                                title="Editar usuario"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={user.isOwner}
                                onClick={() => setDeleting(user)}
                                className="h-8 w-8 hover:text-destructive"
                                title={
                                  user.isOwner
                                    ? 'No se puede eliminar al propietario'
                                    : 'Eliminar usuario'
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t px-6 py-3 text-sm text-muted-foreground">
              {total > 0
                ? `Mostrando ${users.length} de ${total} usuarios · página ${page} de ${Math.max(1, totalPages)}`
                : 'Sin usuarios'}
              {total > USERS_PAGE_SIZE && (
                <span className="ml-3 inline-flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => goToPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => goToPage(page + 1)}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </span>
              )}
            </div>
          </Card>

          <ConfirmDialog
            open={deleting !== null}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
            title="Eliminar usuario"
            description={
              <>
                Se eliminará la cuenta de{' '}
                <ConfirmHighlight>{deleting?.name}</ConfirmHighlight> (
                {deleting?.email}). Esta acción no se puede deshacer.
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
