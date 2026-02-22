import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface BillingFooterProps {
  totalAmount: number;
  invoiceCount: number;
  onExportExcel: () => void;
  onPrintReport: () => void;
}

/**
 * Footer with billing summary and action buttons
 */
export function BillingFooter({ 
  totalAmount, 
  invoiceCount, 
  onExportExcel, 
  onPrintReport 
}: BillingFooterProps) {
  return (
    <div className="flex items-center justify-between border-t bg-card px-6 py-4">
      {/* Stats */}
      <div className="flex items-center gap-8">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Facturado Hoy
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
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={onExportExcel}>
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
        <Button className="gap-2" onClick={onPrintReport}>
          <Printer className="h-4 w-4" />
          Imprimir Reporte
        </Button>
      </div>
    </div>
  );
}
