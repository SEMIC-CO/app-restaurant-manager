import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Receipt,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { inventoryUnitLabel } from '@/components/common';
import { cn } from '@/lib/utils';
import type { DashboardAlerts } from '@/types';

interface AlertsPanelProps {
  alerts: DashboardAlerts;
  className?: string;
}

/** Máximo de artículos sin stock en la lista (el backend trae hasta 10). */
const MAX_STOCK_ROWS = 5;

interface AlertRow {
  key: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  to: string;
}

function plural(count: number, singular: string, feminine?: string): string {
  const noun = count === 1 ? (feminine ?? singular) : `${singular}s`;
  return `${count} ${noun}`;
}

/**
 * Alertas del día: artículos sin stock, facturas sin cobrar y pedidos
 * cancelados. Cada fila lleva a su módulo; si no hay nada, pinta el estado
 * "todo en orden".
 */
export function AlertsPanel({ alerts, className }: AlertsPanelProps) {
  const navigate = useNavigate();

  const stockRows: AlertRow[] = alerts.outOfStock
    .slice(0, MAX_STOCK_ROWS)
    .map((item) => ({
      key: `stock-${item.id}`,
      icon: AlertTriangle,
      tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      title: item.name,
      description: `Sin stock · ${inventoryUnitLabel(item.unitOfMeasure)}`,
      to: '/inventario',
    }));

  const otherRows: AlertRow[] = [];

  if (alerts.pendingInvoices > 0) {
    otherRows.push({
      key: 'pending-invoices',
      icon: Receipt,
      tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      title: `${plural(alerts.pendingInvoices, 'factura')} pendiente de cobro`,
      description: 'Facturadas desde Caja sin emitir todavía',
      to: '/facturacion',
    });
  }

  if (alerts.cancelledOrders > 0) {
    otherRows.push({
      key: 'cancelled-orders',
      icon: XCircle,
      tone: 'bg-red-500/10 text-red-600 dark:text-red-400',
      title: `${plural(alerts.cancelledOrders, 'pedido')} cancelado hoy`,
      description: 'Revisa el detalle en Pedidos',
      to: '/pedidos',
    });
  }

  const hiddenStock = alerts.outOfStock.length - stockRows.length;
  const rows = [...stockRows, ...otherRows];
  const hasHiddenStock = hiddenStock > 0;

  // `min-w-0` es clave en móvil: sin él, los textos `truncate` fijan el ancho
  // mínimo de la tarjeta y estiran toda la fila del grid (scroll horizontal).
  return (
    <Card className={cn('min-w-0 p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Alertas</h3>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 && !hasHiddenStock
              ? 'Nada que atender por ahora'
              : 'Lo que pide atención hoy'}
          </p>
        </div>
        {rows.length > 0 && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            {rows.length + hiddenStock}
          </span>
        )}
      </div>

      {rows.length === 0 && !hasHiddenStock ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg border bg-background p-4">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">Sin alertas</p>
            <p className="text-sm text-muted-foreground">
              Inventario, facturación y pedidos en orden.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => navigate(row.to)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-4 text-left transition hover:bg-muted/40"
            >
              <span
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                  row.tone,
                )}
              >
                <row.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{row.title}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {row.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </button>
          ))}

          {hasHiddenStock && (
            <button
              type="button"
              onClick={() => navigate('/inventario')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground transition hover:bg-muted/40"
            >
              Ver {hiddenStock} {hiddenStock === 1 ? 'artículo más' : 'artículos más'} sin stock
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
