import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Checkbox,
  Badge,
  ScrollArea,
} from '@/components/ui';
import { toast } from '@/hooks';
import {
  menuService,
  permissionService,
  profileService,
  submenuService,
} from '@/services';
import { useAuthStore } from '@/store/auth-store';
import { useNavigationStore } from '@/store/navigation-store';
import type {
  ApiMenu,
  ApiPermission,
  ApiProfile,
  ApiResponse,
  ApiSubmenu,
} from '@/types';
import { Lock, Loader2 } from 'lucide-react';
import { NavIcon } from './nav-icon';

interface ProfilePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Perfil al que se le asignan los módulos. */
  profile: ApiProfile | null;
}

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/**
 * Permisos por perfil: asigna módulos (menús y submenús) del catálogo.
 *
 * El backend guarda la asignación en `profile_permissions` y filtra el sidebar
 * con `GET /menus/mine`, así que lo que se marque aquí es lo que verá el
 * usuario de ese perfil la próxima vez que cargue la app.
 *
 * Los perfiles `SYSTEM` son de plataforma y se comparten entre empresas: el
 * backend responde `403` al intentar modificarlos, por eso el diálogo se abre
 * en modo lectura.
 */
export function ProfilePermissionsDialog({
  open,
  onOpenChange,
  profile,
}: ProfilePermissionsDialogProps) {
  const [menus, setMenus] = React.useState<ApiMenu[]>([]);
  const [submenus, setSubmenus] = React.useState<ApiSubmenu[]>([]);
  const [permissions, setPermissions] = React.useState<ApiPermission[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const readOnly = profile?.type === 'SYSTEM';
  const isAdminProfile = profile?.profile === 'ADMINISTRADOR';

  React.useEffect(() => {
    if (!open || !profile) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const [menusResp, submenusResp, permissionsResp, assignedResp] =
          await Promise.all([
            menuService.listAll(),
            submenuService.listAll(),
            permissionService.listAll(),
            profileService.getPermissions(profile.id),
          ]);

        if (cancelled) return;

        if (menusResp.code !== 200 || submenusResp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar el catálogo',
            description: 'No se pudieron cargar los módulos.',
          });
          return;
        }

        setMenus(menusResp.data);
        setSubmenus(submenusResp.data);
        setPermissions(permissionsResp.code === 200 ? permissionsResp.data : []);
        setSelected(
          new Set(assignedResp.code === 200 ? assignedResp.data : []),
        );
      } catch {
        if (!cancelled) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar permisos',
            description: 'No se pudo conectar con el servidor.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, profile]);

  /** Permiso que representa el módulo completo (menú sin submenú ni acción). */
  const modulePermission = (menuId: number) =>
    permissions.find(
      (permission) =>
        permission.menuId === menuId &&
        permission.submenuId === null &&
        permission.actionId === null,
    );

  /** Permiso que representa un submenú (sin acción). */
  const submenuPermission = (submenuId: number) =>
    permissions.find(
      (permission) =>
        permission.submenuId === submenuId && permission.actionId === null,
    );

  const toggle = (permissionId: number, checked: boolean) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!profile || readOnly) return;

    setSaving(true);
    try {
      const permissionIds = [...selected].sort((a, b) => a - b);
      const resp = await profileService.assignPermissions(
        profile.id,
        permissionIds,
      );

      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '✅ Permisos actualizados',
          description: `El perfil "${profile.profile}" tiene ${resp.data.length} ${
            resp.data.length === 1 ? 'permiso' : 'permisos'
          } asignados.`,
        });

        // Si el perfil editado es el de la sesión, el sidebar se repinta.
        if (useAuthStore.getState().user?.profileId === profile.id) {
          void useNavigationStore.getState().load();
        }

        onOpenChange(false);
      } else {
        toast({
          variant: 'warning',
          title: '❌ Error al guardar',
          description: apiErrorMessage(
            resp,
            'No se pudieron guardar los permisos.',
          ),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al guardar',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Permisos de {profile?.profile ?? 'perfil'}
            {readOnly && (
              <Badge variant="outline" className="gap-1 text-[11px] uppercase">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Plantilla
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? isAdminProfile
                ? 'El perfil ADMINISTRADOR ve siempre todos los módulos del sistema; no necesita permisos asignados.'
                : 'Los perfiles del sistema son plantillas compartidas entre empresas, por eso solo se consultan. Para asignar módulos crea un perfil de empresa con "Nuevo perfil" y asígnalo a tus usuarios.'
              : 'Marca los módulos que verá este perfil en el menú. Se guardan en su perfil y el usuario los verá al iniciar sesión.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando módulos...
          </p>
        ) : menus.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay módulos en el catálogo. Ejecuta el seed de navegación.
          </p>
        ) : (
          <ScrollArea className="max-h-[55vh] space-y-2 pr-2">
            <div className="space-y-2">
              {menus.map((menu) => {
                const module = modulePermission(menu.id);
                const children = submenus.filter(
                  (submenu) => submenu.menuId === menu.id,
                );

                return (
                  <div
                    key={menu.id}
                    className="rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={module ? selected.has(module.id) : false}
                        disabled={!module || readOnly}
                        onCheckedChange={(checked) => {
                          if (module) toggle(module.id, checked === true);
                        }}
                      />
                      <NavIcon
                        name={menu.icon}
                        className="h-4 w-4 text-muted-foreground"
                      />
                      <span className="text-sm font-medium">{menu.menu}</span>
                      <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                        {menu.path}
                      </span>
                    </label>

                    {children.length > 0 && (
                      <div className="mt-2 space-y-1.5 pl-7">
                        {children.map((submenu) => {
                          const permission = submenuPermission(submenu.id);
                          return (
                            <label
                              key={submenu.id}
                              className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"
                            >
                              <Checkbox
                                checked={
                                  permission
                                    ? selected.has(permission.id)
                                    : false
                                }
                                disabled={!permission || readOnly}
                                onCheckedChange={(checked) => {
                                  if (permission)
                                    toggle(permission.id, checked === true);
                                }}
                              />
                              <NavIcon
                                name={submenu.icon}
                                className="h-3.5 w-3.5"
                              />
                              {submenu.submenu}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="items-center justify-between gap-2 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {selectedCount} {selectedCount === 1 ? 'permiso' : 'permisos'}{' '}
            seleccionados
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Guardar permisos
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
