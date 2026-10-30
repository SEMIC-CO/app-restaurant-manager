import { Eye } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  /** Email del cliente si se capturó al cobrar. */
  customerEmail?: string;
  /** PENDIENTE (sin emitir) | EMITIDA (ante la DIAN) | ANULADA. */
  status: 'pending' | 'emitted' | 'cancelled';
  total: number;
  /** Propina voluntaria registrada (no forma parte de `total`). */
  tip: number;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onViewDetails: (invoiceId: string) => void;
}

/**
 * Table displaying invoice history
 */
export function InvoiceTable({ invoices, onViewDetails }: InvoiceTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-muted-foreground">
                Nº Factura
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-muted-foreground">
                Fecha y Hora
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-muted-foreground">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase text-muted-foreground">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase text-muted-foreground">
                Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase text-muted-foreground">
                Propina
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium uppercase text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  <div>
                    <p>{invoice.date}</p>
                    <p className="text-xs">• {invoice.time}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <p>{invoice.customerName}</p>
                  {invoice.customerEmail && (
                    <p className="text-xs text-muted-foreground">
                      {invoice.customerEmail}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {invoice.status === 'emitted' ? (
                    <Badge variant="success">EMITIDA</Badge>
                  ) : invoice.status === 'cancelled' ? (
                    <Badge variant="destructive">ANULADA</Badge>
                  ) : (
                    <Badge variant="warning">PENDIENTE</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted-foreground">
                  {invoice.tip > 0 ? formatCurrency(invoice.tip) : '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <Button 
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => onViewDetails(invoice.id)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
