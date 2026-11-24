import {
  Armchair,
  BarChart3,
  Banknote,
  Boxes,
  Briefcase,
  ChefHat,
  Circle,
  ClipboardList,
  Coins,
  Grid3x3,
  IdCard,
  LayoutDashboard,
  MonitorPlay,
  Package,
  Plus,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Iconos que el backend guarda por nombre en `menus.icon` / `submenus.icon`.
 * Si el catálogo trae un nombre desconocido se pinta un círculo neutro, para
 * que un icono nuevo no rompa el sidebar.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  Armchair,
  BarChart3,
  Banknote,
  Boxes,
  Briefcase,
  ChefHat,
  ClipboardList,
  Coins,
  Grid3x3,
  IdCard,
  LayoutDashboard,
  MonitorPlay,
  Package,
  Plus,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  Wallet,
};

interface NavIconProps {
  /** Nombre del icono de `lucide-react` (p. ej. `LayoutDashboard`). */
  name: string;
  className?: string;
}

export function NavIcon({ name, className }: NavIconProps) {
  const Icon = NAV_ICONS[name] ?? Circle;
  return <Icon className={className} aria-hidden="true" />;
}
