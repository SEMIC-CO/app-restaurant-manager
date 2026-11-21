import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ClipboardList,
  Minus,
  Package,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import type { DashboardKpis } from '@/types';

interface DashboardKpiCardsProps {
  kpi: DashboardKpis;
}

interface KpiDefinition {
  label: string;
  value: string;
  delta: number | null;
  /** Valor del día anterior, para el pie de la tarjeta. */
  previous: string;
  icon: LucideIcon;
  tone: string;
}

/**
 * Variación respecto al día anterior. Las cuatro métricas del dashboard son
 * "más es mejor", así que el verde siempre es subida. Sin base (ayer en 0)
 * no se pinta porcentaje.
 */
function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">Sin datos ayer</span>
    );
  }

  const tone =
    value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground';
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', tone)}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
      <span className="font-normal text-muted-foreground">vs ayer</span>
    </span>
  );
}

/**
 * Tarjetas de KPI del día con su comparativa contra el día anterior
 * (`GET /reports/dashboard` → `kpi`).
 */
export function DashboardKpiCards({ kpi }: DashboardKpiCardsProps) {
  const definitions: KpiDefinition[] = [
    {
      label: 'Ventas de hoy',
      value: formatCurrency(kpi.today.sales),
      delta: kpi.delta.sales,
      previous: `Ayer ${formatCurrency(kpi.yesterday.sales)}`,
      icon: Banknote,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pedidos de hoy',
      value: kpi.today.orders.toLocaleString('es-VE'),
      delta: kpi.delta.orders,
      previous: `Ayer ${kpi.yesterday.orders.toLocaleString('es-VE')}`,
      icon: ClipboardList,
      tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Ticket promedio',
      value: formatCurrency(kpi.today.avgTicket),
      delta: kpi.delta.avgTicket,
      previous: `Ayer ${formatCurrency(kpi.yesterday.avgTicket)}`,
      icon: Wallet,
      tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Unidades vendidas',
      value: kpi.today.units.toLocaleString('es-VE'),
      delta: kpi.delta.units,
      previous: `Ayer ${kpi.yesterday.units.toLocaleString('es-VE')}`,
      icon: Package,
      tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
  ];

  // Las tarjetas llevan `min-w-0` para que los valores `truncate` no fijen
  // el ancho mínimo de la columna en pantallas chicas.
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {definitions.map(({ label, value, delta, previous, icon: Icon, tone }) => (
        <Card key={label} className="min-w-0 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 truncate text-3xl font-bold" title={value}>
                {value}
              </p>
            </div>
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
                tone,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <DeltaBadge value={delta} />
            <span className="text-xs text-muted-foreground">{previous}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
