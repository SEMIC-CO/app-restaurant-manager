import { Clock, Calendar, CalendarDays, CalendarRange, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface BillingSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activePeriod: string;
  onPeriodChange: (periodId: string) => void;
}

const periodFilters: PeriodFilter[] = [
  { id: 'today', label: 'Hoy', icon: <Clock className="h-4 w-4" /> },
  { id: 'week', label: 'Esta Semana', icon: <Calendar className="h-4 w-4" /> },
  { id: 'month', label: 'Este Mes', icon: <CalendarDays className="h-4 w-4" /> },
  { id: 'custom', label: 'Personalizado', icon: <CalendarRange className="h-4 w-4" /> },
];

/**
 * Sidebar for billing page with search and period filters
 */
export function BillingSidebar({ 
  searchQuery, 
  onSearchChange, 
  activePeriod, 
  onPeriodChange 
}: BillingSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Clock className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold">Historial</span>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <p className="mb-2 text-xs font-medium uppercase opacity-80">Buscar Factura</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/60" />
          <input
            type="search"
            placeholder="Nº de factura..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg bg-white/20 pl-10 pr-3 text-sm placeholder:text-primary-foreground/60 focus:bg-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Period filters */}
      <div className="flex-1 px-4">
        <p className="mb-3 text-xs font-medium uppercase opacity-80">Período</p>
        <div className="space-y-2">
          {periodFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onPeriodChange(filter.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                activePeriod === filter.id
                  ? 'bg-white text-primary'
                  : 'bg-white/10 hover:bg-white/20'
              )}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* User info at bottom */}
      <div className="mt-auto border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            👤
          </div>
          <div>
            <p className="font-medium">Caja 01</p>
            <p className="text-sm opacity-80">Carlos R.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
