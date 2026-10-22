import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    to: '/configuracion/mesas',
    label: 'Mesas',
    icon: <Armchair className="h-5 w-5" />,
  },
  {
    to: '/configuracion/categorias',
    label: 'Categorías',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    to: '/configuracion/productos',
    label: 'Productos',
    icon: <Package className="h-5 w-5" />,
  },
  {
    to: '/configuracion/usuarios',
    label: 'Usuarios',
    icon: <Users className="h-5 w-5" />,
  },
];

function renderNavItem(item: NavItem) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end ?? false}
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

export function ConfigSidebar() {
  return (
    <div className="flex h-full flex-col p-4">
      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
            PRINCIPAL
          </p>
          {mainNavItems.map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
            CONFIGURACIÓN
          </p>
          {configNavItems.map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">
            SISTEMA
          </p>
          <NavLink
            to="/configuracion/sistema"
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
  );
}
