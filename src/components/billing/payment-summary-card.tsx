import { Receipt, CreditCard, Printer, Mail, XCircle } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface PaymentSummary {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  /** Propina voluntaria: no forma parte de la base imponible. */
  voluntaryTip?: number;
}

interface PaymentSummaryCardProps {
  payment: PaymentSummary;
  onPrintReceipt?: () => void;
  onSendEmail?: () => void;
  onCancelOrder?: () => void;
}

/**
 * Payment summary sidebar for invoice detail
 */
export function PaymentSummaryCard({ 
  payment, 
  onPrintReceipt, 
  onSendEmail, 
  onCancelOrder 
}: PaymentSummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Resumen de Pago</h3>
      </div>

      {/* Amounts */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(payment.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IVA ({payment.taxRate}%)</span>
          <span>{formatCurrency(payment.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Descuento ({payment.discountRate}%)</span>
          <span>-{formatCurrency(payment.discountAmount)}</span>
        </div>
        {Boolean(payment.voluntaryTip) && (
          <div className="flex justify-between text-green-600">
            <span>Propina (voluntaria)</span>
            <span>{formatCurrency(payment.voluntaryTip ?? 0)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-6 border-t pt-4">
        <p className="text-xs text-muted-foreground uppercase">Total a Pagar</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(payment.total)}
          </span>
          <span className="text-sm text-muted-foreground">{payment.currency}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-muted p-3">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Método de Pago</p>
          <p className="font-medium">{payment.paymentMethod}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onPrintReceipt}
        >
          <Printer className="h-4 w-4" />
          Imprimir Recibo
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onSendEmail}
        >
          <Mail className="h-4 w-4" />
          Enviar por Correo
        </Button>
        {onCancelOrder && (
          <Button 
            variant="ghost" 
            className="w-full justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onCancelOrder}
          >
            <XCircle className="h-4 w-4" />
            Anular Factura
          </Button>
        )}
      </div>
    </Card>
  );
}
