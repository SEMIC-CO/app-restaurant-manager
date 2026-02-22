import { ArrowLeft, Printer, Mail, CheckCircle } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BusinessInfo {
  name: string;
  tagline: string;
  address: string;
  taxId: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceType: string;
  date: string;
  time: string;
  business: BusinessInfo;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface CheckoutInvoiceCardProps {
  invoice: InvoiceData;
  onBack: () => void;
  onPrint: () => void;
  onSendEmail: () => void;
  onEmitInvoice: () => void;
}

/**
 * Invoice detail card for checkout process
 */
export function CheckoutInvoiceCard({
  invoice,
  onBack,
  onPrint,
  onSendEmail,
  onEmitInvoice,
}: CheckoutInvoiceCardProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Detalle de Facturación</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {invoice.date} • {invoice.time}
        </p>
      </div>

      {/* Invoice card */}
      <Card className="flex-1 overflow-hidden">
        {/* Business header */}
        <div className="flex items-start justify-between border-b p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-2xl">
              🥟
            </div>
            <div>
              <h2 className="text-xl font-bold">{invoice.business.name}</h2>
              <p className="text-sm text-muted-foreground">{invoice.business.tagline}</p>
              <p className="text-xs text-muted-foreground">
                {invoice.business.address} • CUIT: {invoice.business.taxId}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-1">{invoice.invoiceType}</Badge>
            <p className="font-mono text-lg font-bold">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                  Cant.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Unitario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </td>
                  <td className="px-6 py-4 text-center">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t p-6">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA ({invoice.taxRate}%)</span>
              <span>{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total Final</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-800 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
            💳
          </div>
          <div>
            <p className="font-medium">Caja 01</p>
            <p className="text-sm text-slate-400">Operador: Carlos R.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-transparent border-slate-600 text-white hover:bg-slate-700" onClick={onPrint}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent border-slate-600 text-white hover:bg-slate-700" onClick={onSendEmail}>
            <Mail className="h-4 w-4" />
            Enviar Email
          </Button>
          <Button className="gap-2" onClick={onEmitInvoice}>
            <CheckCircle className="h-4 w-4" />
            Emitir Factura
          </Button>
        </div>
      </div>
    </div>
  );
}
