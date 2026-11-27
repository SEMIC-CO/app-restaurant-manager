import { NavLink } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';
import { NavIcon } from './nav-icon';

interface AppNavProps {
  /** Se llama al pulsar un enlace (el drawer móvil lo usa para cerrarse). */
  onNavigate?: () => void;
}

/** Orden fijo de los bloques del sidebar; los grupos nuevos van al final. */
const SECTION_ORDER = ['PRINCIPAL', 'CONFIGURACIÓN', 'SISTEMA'];
const DEFAULT_SECTION = 'PRINCIPAL';

/**
 * Módulos que se abren en pestaña nueva en vez de reemplazar la actual.
 * La vista cliente es la segunda pantalla de Caja: debe quedar abierta en
 * otro monitor/pestaña mientras se cobra en la principal.
 */
const NEW_TAB_PATHS = new Set(['/caja/vista-cliente']);

function sectionRank(section: string) {
  const index = SECTION_ORDER.indexOf(section);
  return index === -1 ? SECTION_ORDER.length : index;
}

const linkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

/**
 * Sidebar del perfil autenticado. Los módulos vienen de `GET /menus/mine`
 * (cargados al iniciar sesión en `useNavigationBootstrap`), agrupados por el
 * `groupName` de cada menú.
 */
export function AppNav({ onNavigate }: AppNavProps) {
  const status = useNavigationStore((state) => state.status);
  const menus = useNavigationStore((state) => state.menus);

  if (status === 'idle' || status === 'loading') {
    return (
      <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando módulos...
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        No se pudieron cargar tus módulos.
      </p>
    );
  }

  if (menus.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        Tu perfil no tiene módulos asignados. Pide a un administrador que te
        asigne permisos.
      </p>
    );
  }

  const sections = new Map<string, typeof menus>();
  for (const menu of menus) {
    const section = menu.groupName?.trim() || DEFAULT_SECTION;
    const items = sections.get(section) ?? [];
    items.push(menu);
    sections.set(section, items);
  }

  return (
    <>
      {[...sections.entries()]
        .sort(([a], [b]) => sectionRank(a) - sectionRank(b))
        .map(([section, items]) => (
          <div key={section} className="space-y-1">
            <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">
              {section}
            </p>

            {items.map((menu) => (
              <div key={menu.id} className="space-y-1">
                <NavLink
                  to={menu.path}
                  end={menu.path === '/'}
                  target={NEW_TAB_PATHS.has(menu.path) ? '_blank' : undefined}
                  rel={
                    NEW_TAB_PATHS.has(menu.path)
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  onClick={onNavigate}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <NavIcon name={menu.icon} className="h-5 w-5" />
                  {menu.menu}
                </NavLink>

                {menu.submenus.map((submenu) => (
                  <NavLink
                    key={submenu.id}
                    to={submenu.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-lg py-1.5 pl-11 pr-3 text-sm transition-colors',
                        isActive
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    <NavIcon name={submenu.icon} className="h-4 w-4" />
                    {submenu.submenu}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        ))}
    </>
  );
}
