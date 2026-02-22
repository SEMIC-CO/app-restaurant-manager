import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
];

const configLinks = [
  { to: '/perfil', label: 'Ajustes del Sistema', icon: Settings },
];

interface ProfileSidebarProps {
  onLogout?: () => void;
}

/**
 * Sidebar for profile/settings page
 */
export function ProfileSidebar({ onLogout }: ProfileSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-muted/50">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl">
          🥟
        </div>
        <div>
          <p className="font-bold text-primary">Empanadas</p>
          <p className="text-xs text-muted-foreground">EXPRESS ADMIN</p>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {mainLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}

        {/* Configuration section */}
        <div className="pt-6">
          <p className="px-4 pb-2 text-xs font-medium uppercase text-muted-foreground">
            Configuración
          </p>
          {configLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                )
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
