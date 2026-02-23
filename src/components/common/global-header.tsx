import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Pedidos' },
  { to: '/cocina', label: 'Cocina' },
  { to: '/entregas', label: 'Entregas' },
  { to: '/facturacion', label: 'Facturación' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/configuracion', label: 'Configuración' },
];

/**
 * Global header navigation used across all layouts
 * Shows business branding and main navigation links
 */
export function GlobalHeader() {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/perfil');
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    console.log('Logging out...');
    // TODO: Implement logout logic
  };

  return (
    <div className="flex h-[60px] items-center justify-between px-6">
      {/* Left: Logo + Business name */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl">
          🥟
        </div>
        <span className="text-lg font-bold text-primary">Empanadas Manager</span>
      </div>

      {/* Center: Navigation links */}
      <nav className="hidden items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Search + Notifications + User avatar */}
      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar reporte..."
            className="h-9 w-48 pl-10 pr-3"
          />
        </div>

        {/* Notifications bell */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User avatar with dropdown */}
        <div className="relative" ref={menuRef}>
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          >
            <span className="text-sm font-medium">👤</span>
          </Button>

          {/* Dropdown menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card py-1 shadow-lg z-50">
              <button
                onClick={handleProfile}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                Perfil
              </button>
              <div className="my-1 border-t" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
