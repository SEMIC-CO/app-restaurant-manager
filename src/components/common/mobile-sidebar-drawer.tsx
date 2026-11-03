import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  ClipboardList,
  ChefHat,
  Truck,
  Receipt,
  BarChart3,
  Grid3x3,
  Banknote,
  Armchair,
  Wallet,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    end: true,
  },
  {
    to: '/mesas',
    label: 'Mesas',
    icon: <Grid3x3 className="h-5 w-5" />,
    end: true,
  },
  {
    to: '/pedidos',
    label: 'Pedidos',
    icon: <ClipboardList className="h-5 w-5" />,
    end: true,
  },
  {
    to: '/cocina',
    label: 'Cocina',
    icon: <ChefHat className="h-5 w-5" />,
  },
  {
    to: '/entregas',
    label: 'Entregas',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    to: '/caja',
    label: 'Caja',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    to: '/facturacion',
    label: 'Facturación',
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const configNavItems: NavItem[] = [
  {
    to: '/configuracion/productos',
    label: 'Productos',
    icon: <Package className="h-5 w-5" />,
  },
  {
    to: '/configuracion/categorias',
    label: 'Categorías',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    to: '/configuracion/mesas',
    label: 'Mesas',
    icon: <Armchair className="h-5 w-5" />,
  },
  {
    to: '/configuracion/usuarios',
    label: 'Usuarios',
    icon: <Users className="h-5 w-5" />,
  },
  {
    to: '/configuracion/nomina',
    label: 'Nómina',
    icon: <Wallet className="h-5 w-5" />,
  },
];

function renderNavItem(item: NavItem, onNavigate?: () => void) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end ?? false}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

/**
 * Global mobile sidebar drawer (fixed full-screen layer).
 * Always mounted at App root so the hamburger in GlobalHeader works on ANY page.
 * Automatically closes on route change or backdrop click.
 */
export function MobileSidebarDrawer() {
  const location = useLocation();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);

  // Auto-close on route change
  useEffect(() => {
    if (sidebarOpen) closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] lg:hidden',
        sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!sidebarOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Sliding panel */}
      <aside
        className={cn(
          'absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-card border-r shadow-2xl',
          'transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Mobile header with close button */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg">
                🥟
              </div>
              <span className="font-bold text-foreground">Menú</span>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto">
            <div className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
                PRINCIPAL
              </p>
              {mainNavItems.map((i) => renderNavItem(i, closeSidebar))}
            </div>

            <div className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
                CONFIGURACIÓN
              </p>
              {configNavItems.map((i) => renderNavItem(i, closeSidebar))}
            </div>

            <div className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
                SISTEMA
              </p>
              <NavLink
                to="/configuracion/sistema"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Settings className="h-5 w-5" />
                Configuración General
              </NavLink>
            </div>
          </nav>
        </div>
      </aside>
    </div>
  );
}
