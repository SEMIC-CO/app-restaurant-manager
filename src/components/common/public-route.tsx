import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { firstMenuPath, useAuthStore, useNavigationStore } from '@/store';

/** Dashboard del admin: destino de respaldo si el perfil no tiene módulos. */
export const ADMIN_HOME_ROUTE = '/';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Rutas públicas (login, registro, activación): si el backend ya confirmó
 * una sesión activa, se redirige al primer módulo del perfil (Mesas para
 * MESERO, Cocina para JEFE DE COCINA, dashboard para ADMINISTRADOR) en lugar
 * de mostrar el formulario.
 */
export function PublicRoute() {
  const status = useAuthStore((state) => state.status);
  const navigationStatus = useNavigationStore((state) => state.status);
  const menus = useNavigationStore((state) => state.menus);

  if (status === 'checking') {
    return <FullScreenLoader />;
  }

  if (status === 'authenticated') {
    // El sidebar se carga justo después de autenticar: se espera para no
    // mandar al dashboard a un perfil que no lo tiene.
    if (navigationStatus === 'idle' || navigationStatus === 'loading') {
      return <FullScreenLoader />;
    }
    return <Navigate to={firstMenuPath(menus)} replace />;
  }

  return <Outlet />;
}
