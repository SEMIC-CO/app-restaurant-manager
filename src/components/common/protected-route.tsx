import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { firstMenuPath, useAuthStore, useNavigationStore } from '@/store';
import { canAccessPath } from '@/utils';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Si el sidebar no se pudo cargar no se puede saber qué rutas permite el
 * perfil, así que se bloquea el acceso (fail-closed) en lugar de dejar pasar
 * cualquier URL.
 */
function NavigationErrorScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-medium">No se pudo cargar tu menú</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Revisa tu conexión e inténtalo de nuevo. Si el problema continúa, cierra
        sesión y vuelve a entrar.
      </p>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => void useNavigationStore.getState().load()}
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}

/**
 * Rutas privadas: exigen sesión verificada por el backend.
 *
 * Además del login, valida que la ruta pedida pertenezca a un módulo del
 * perfil (`GET /menus/mine`). Así, escribir a mano `/configuracion/usuarios`
 * con un perfil que no lo tiene no carga la página: se redirige al primer
 * módulo permitido. El backend sigue siendo la autoridad de cada endpoint.
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const navigationStatus = useNavigationStore((state) => state.status);
  const isAdmin = useNavigationStore((state) => state.isAdmin);
  const menus = useNavigationStore((state) => state.menus);
  const location = useLocation();

  if (status === 'checking') {
    return <FullScreenLoader />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // El sidebar llega justo después de autenticar. Se espera para no montar
  // una página fuera del perfil (y disparar sus peticiones) ni redirigir
  // a ciegas.
  if (navigationStatus === 'idle' || navigationStatus === 'loading') {
    return <FullScreenLoader />;
  }

  if (navigationStatus === 'error') {
    return <NavigationErrorScreen />;
  }

  // El ADMINISTRADOR ve todo el catálogo, incluidas rutas fuera del menú.
  if (navigationStatus === 'ready' && !isAdmin) {
    const allowedPaths = menus.flatMap((menu) => [
      menu.path,
      ...menu.submenus.map((submenu) => submenu.path),
    ]);

    if (menus.length === 0) {
      // Sin módulos asignados: solo el dashboard (que explica el caso) y las
      // rutas personales. Evita un bucle de redirecciones.
      if (location.pathname !== '/' && !canAccessPath(location.pathname, [])) {
        return <Navigate to="/" replace />;
      }
    } else if (!canAccessPath(location.pathname, allowedPaths)) {
      return <Navigate to={firstMenuPath(menus)} replace />;
    }
  }

  return <Outlet />;
}
