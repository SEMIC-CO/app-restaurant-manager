import { AppNav } from './app-nav';

/**
 * Sidebar de escritorio.
 *
 * Los enlaces no están en el código: salen de `GET /menus/mine`, que devuelve
 * los menús y submenús asignados al perfil del JWT (el ADMINISTRADOR ve todo
 * el catálogo). Se cargan al iniciar sesión con `useNavigationBootstrap()`.
 */
export function ConfigSidebar() {
  return (
    <div className="flex h-full flex-col p-4">
      <nav className="flex-1 space-y-6 overflow-y-auto">
        <AppNav />
      </nav>
    </div>
  );
}
