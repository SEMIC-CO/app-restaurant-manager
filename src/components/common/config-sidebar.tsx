import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function ConfigSidebar() {
  const navItems: NavItem[] = [
    {
      to: '/configuracion',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
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
      to: '/configuracion/usuarios',
      label: 'Usuarios',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-full flex-col p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold">EM</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-primary text-sm leading-tight">Empanada</span>
          <span className="font-bold text-primary text-sm leading-tight">Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/configuracion'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* Sistema section */}
        <div className="pt-4">
          <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">SISTEMA</p>
          <NavLink
            to="/configuracion/sistema"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
