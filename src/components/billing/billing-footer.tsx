import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface BillingFooterProps {
  totalAmount: number;
  invoiceCount: number;
  /** Rótulo del monto acumulado (según el período activo). */
  totalLabel?: string;
  onExportExcel: () => void;
  onPrintReport: () => void;
}

/**
 * Footer with billing summary and action buttons
 */
export function BillingFooter({ 
  totalAmount, 
  invoiceCount,
  totalLabel = 'Total Facturado Hoy',
  onExportExcel, 
  onPrintReport 
}: BillingFooterProps) {
  // En móvil los datos y las acciones se apilan: el flex sin wrap obligaba
  // a los botones a salirse del ancho y generaba scroll horizontal.
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-card px-6 py-4">
      {/* Stats */}
      <div className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {totalLabel}
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Facturas Emitidas
          </p>
          <p className="text-2xl font-bold">{invoiceCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          onClick={onExportExcel}
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
        <Button className="w-full gap-2 sm:w-auto" onClick={onPrintReport}>
          <Printer className="h-4 w-4" />
          Imprimir Reporte
        </Button>
      </div>
    </div>
  );
}
