import {
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface FinancialKpiCardsProps {
  /** Σ ingresos (facturas cobradas) del período. */
  income: number;
  /** Σ egresos (nómina + compras + gastos) del período. */
  expenses: number;
  /** Ingresos − Egresos. */
  net: number;
  /** Margen neto (0–100) sobre los ingresos. */
  marginPct: number;
  /** Propinas cobradas: NO entran en `income` ni en `net`. */
  tips: number;
}

/**
 * Tarjetas KPI del reporte financiero: ingresos, egresos, ganancia neta y
 * margen. Las propinas se muestran aparte dentro de la tarjeta de ingresos.
 */
export function FinancialKpiCards({
  income,
  expenses,
  net,
  marginPct,
  tips,
}: FinancialKpiCardsProps) {
  const cards = [
    {
      label: 'Total Ingresos',
      value: formatCurrency(income),
      hint: tips > 0
        ? `Propinas aparte: ${formatCurrency(tips)}`
        : 'Facturas cobradas del período',
      icon: TrendingUp,
      iconClass: 'text-emerald-600 bg-emerald-500/10',
      valueClass: net >= 0 ? undefined : 'text-red-600',
    },
    {
      label: 'Total Egresos',
      value: formatCurrency(expenses),
      hint: 'Nómina + compras + gastos',
      icon: TrendingDown,
      iconClass: 'text-red-600 bg-red-500/10',
    },
    {
      label: 'Ganancia Neta',
      value: formatCurrency(net),
      hint: net >= 0 ? 'Ingresos − egresos' : 'Pérdida del período',
      icon: Wallet,
      iconClass: net >= 0
        ? 'text-emerald-600 bg-emerald-500/10'
        : 'text-red-600 bg-red-500/10',
      valueClass: net < 0 ? 'text-red-600' : undefined,
    },
    {
      label: 'Margen Neto',
      value: `${marginPct}%`,
      hint: 'Ganancia sobre ingresos',
      icon: Percent,
      iconClass: marginPct >= 0
        ? 'text-sky-600 bg-sky-500/10'
        : 'text-red-600 bg-red-500/10',
      valueClass: marginPct < 0 ? 'text-red-600' : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase">
                {card.label}
              </p>
              <p className={`mt-2 text-3xl font-bold ${card.valueClass ?? ''}`}>
                {card.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{card.hint}</p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.iconClass}`}
            >
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
