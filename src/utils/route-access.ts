/**
 * Control de acceso de rutas del frontend.
 *
 * El menú del perfil (`GET /menus/mine`, en `useNavigationStore`) es la fuente
 * de verdad de lo que el usuario puede abrir. Como hay rutas que no son
 * módulos del sidebar (alta de producto, checkout...), aquí se mapean a su
 * módulo.
 *
 * Esto es solo UX: la autorización real la sigue haciendo el backend en cada
 * endpoint.
 */

/** Rutas personales accesibles con cualquier perfil (no son módulos). */
export const ALWAYS_ALLOWED_PATHS = ['/perfil'];

/**
 * Prefijos de ruta que pertenecen a un módulo pero viven en otra URL.
 * Ej.: el alta de producto está en `/productos/nuevo` y su módulo es
 * `/configuracion/productos`.
 */
const MODULE_ALIASES: Array<{ prefix: string; module: string }> = [
  { prefix: '/productos', module: '/configuracion/productos' },
  { prefix: '/checkout', module: '/caja' },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Módulo del sidebar al que pertenece una ruta. */
export function requiredModuleFor(pathname: string): string {
  const alias = MODULE_ALIASES.find(({ prefix }) =>
    matchesPrefix(pathname, prefix),
  );
  return alias ? alias.module : pathname;
}

/**
 * `true` si la ruta pertenece a alguno de los módulos permitidos.
 * Un módulo da acceso a sus rutas hijas (`/pedidos` → `/pedidos/nuevo`).
 */
export function canAccessPath(
  pathname: string,
  allowedPaths: string[],
): boolean {
  if (ALWAYS_ALLOWED_PATHS.some((path) => matchesPrefix(pathname, path))) {
    return true;
  }

  const required = requiredModuleFor(pathname);
  return allowedPaths.some((modulePath) =>
    matchesPrefix(required, modulePath),
  );
}
