import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store';

/** Dashboard del admin: destino tras iniciar sesión o al estar ya autenticado. */
export const ADMIN_HOME_ROUTE = '/';

/**
 * Rutas públicas (login, registro, activación): si el backend ya confirmó
 * una sesión activa, se redirige al dashboard en lugar de mostrar el
 * formulario.
 */
export function PublicRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to={ADMIN_HOME_ROUTE} replace />;
  }

  return <Outlet />;
}
