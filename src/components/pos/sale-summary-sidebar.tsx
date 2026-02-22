import { Receipt } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface SaleSummary {
  orderNumber: string;
  tableNumber: number;
  subtotal: number;
  discount: number;
  taxRate: number;
  total: number;
}

interface SaleSummarySidebarProps {
  summary: SaleSummary;
}

/**
 * Orange sidebar showing sale summary for checkout
 */
export function SaleSummarySidebar({ summary }: SaleSummarySidebarProps) {
  return (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 p-6 pb-4">
        <Receipt className="h-5 w-5" />
        <span className="text-sm font-medium uppercase opacity-80">Resumen de Venta</span>
      </div>

      {/* Total */}
      <div className="px-6 pb-6">
        <p className="text-sm opacity-80">TOTAL A PAGAR</p>
        <p className="text-5xl font-bold">{formatCurrency(summary.total).replace('$', '')}</p>
        <p className="text-sm opacity-80">IVA Incluido ({summary.taxRate}%)</p>
      </div>

      {/* Order info */}
      <div className="mx-6 flex gap-4 rounded-lg bg-white/10 p-4">
        <div className="flex-1">
          <p className="text-xs opacity-80">PEDIDO</p>
          <p className="text-xl font-bold">#{summary.orderNumber}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs opacity-80">MESA</p>
          <p className="text-xl font-bold">{summary.tableNumber}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mx-6 mt-6 space-y-3">
        <div className="flex justify-between rounded-lg bg-white/10 p-4">
          <span>Subtotal</span>
          <span className="font-semibold">{formatCurrency(summary.subtotal)}</span>
        </div>
        <div className="flex justify-between rounded-lg bg-white/10 p-4">
          <span>Descuento</span>
          <span className="font-semibold text-green-300">-{formatCurrency(summary.discount)}</span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Cashier info */}
      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            💳
          </div>
          <div>
            <p className="font-medium">Caja 01</p>
            <p className="text-sm opacity-80">Operador: Carlos R.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
