import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useThemeStore, useUiStore, useAuthStore, clearSessionScope } from '@/store';
import { authService } from '@/services';
import { useCurrentHeadquarter } from '@/hooks';

const navLinks: Array<{ to: string; label: string }> = [];

/**
 * Header interno de aplicación (va AL LADO del sidebar, no encima).
 * Contiene: hamburguesa (mobile), logo, buscador, toggle tema,
 * notificaciones y usuario.
 */
export function AppHeader() {
    const navigate = useNavigate();
    const openSidebar = useUiStore((state) => state.openSidebar);
    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const user = useAuthStore((state) => state.user);
    const clearSession = useAuthStore((state) => state.clearSession);
    const headquarter = useCurrentHeadquarter();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        try {
            await authService.logout();
        } catch {
            /* ignore */
        }
        clearSession();
        clearSessionScope();
        navigate('/login');
    };

    return (
        <div className="flex h-[60px] items-center justify-between border-b bg-card px-4 gap-2 sm:px-6">
            {/* Left: Menu button (mobile) + Logo + Business name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={openSidebar}
                    className="h-10 w-10 lg:hidden flex-shrink-0"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <img
                    src="/favicon.svg"
                    alt="RestoBar Manager"
                    className="h-8 w-8 flex-shrink-0 rounded-lg"
                />
                <span
                    className="hidden sm:block text-lg font-bold text-primary truncate"
                    title={headquarter?.name ?? 'RestoBar Manager'}
                >
                    {headquarter?.name ?? 'RestoBar Manager'}
                </span>
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

            {/* Right: Search + Theme toggle + Notifications + User avatar */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Search input */}
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        placeholder="Buscar reporte..."
                        className="h-9 w-48 pl-10 pr-3"
                    />
                </div>

                {/* Theme toggle light/dark */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                    className="rounded-full flex-shrink-0"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>

                {/* Notifications bell */}
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                    <Bell className="h-5 w-5" />
                </Button>

                {/* User avatar with dropdown */}
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground flex-shrink-0"
                    >
                        <span className="text-sm font-medium">
                            {user ? user.name.charAt(0).toUpperCase() : '👤'}
                        </span>
                    </Button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-card py-1 shadow-lg z-50">
                            {user && (
                                <div className="border-b px-4 py-2">
                                    <p className="truncate text-sm font-medium">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            )}
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

export { AppHeader as GlobalHeader };
