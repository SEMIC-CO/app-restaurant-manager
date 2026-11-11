import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { firstMenuPath, useAuthStore, useNavigationStore } from '@/store';

/**
 * Rutas privadas: exigen sesión verificada por el backend. Mientras se
 * verifica se muestra un loader; si no hay sesión, se redirige a /login
 * guardando la ruta de origen para volver a ella tras iniciar sesión.
 *
 * El dashboard (`/`) es un módulo más: si el perfil no lo tiene (MESERO,
 * JEFE DE COCINA), al entrar o recargar en `/` se redirige a su primer módulo.
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const navigationStatus = useNavigationStore((state) => state.status);
  const menus = useNavigationStore((state) => state.menus);
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const home = firstMenuPath(menus);
  const dashboardAllowed = menus.some((menu) => menu.path === '/');
  if (
    navigationStatus === 'ready' &&
    location.pathname === '/' &&
    home !== '/' &&
    !dashboardAllowed
  ) {
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
