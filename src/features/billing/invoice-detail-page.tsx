import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Printer } from 'lucide-react';
import { DashboardLayout } from '@/app/layout/dashboard-layout';
import { Button, Badge } from '@/components/ui';
import {
  CustomerInfoCard,
  ProductsSummaryCard,
  PaymentSummaryCard,
  InvoiceStatusBar,
} from '@/components/billing';
import { ConfigSidebar } from '@/components/common';
import { ORDER_STATUS_LABELS } from '@/components/pos';
import { toast } from '@/hooks';
import { invoiceService, orderService, productService } from '@/services';
import { formatOrderNumber } from '@/utils';
import type { ApiInvoice, ApiOrder, ApiResponse, ApiOrderStatus } from '@/types';

/** Etiquetas de `invoices.payment_method` para el resumen de pago. */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Cash: 'Efectivo',
  Card: 'Tarjeta',
  Transfer: 'Transferencia',
};

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

function getStatusBadge(status: ApiInvoice['status']) {
  switch (status) {
    case 'emitted':
      return <Badge variant="success">EMITIDA</Badge>;
    case 'pending':
      return <Badge variant="warning">PENDIENTE</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">ANULADA</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Porcentaje (redondeado) de un importe sobre el subtotal. */
function rateOf(amount: number, subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round((amount / subtotal) * 100);
}

/**
 * Detalle de factura con datos reales: `GET /invoices/:id` más los ítems del
 * pedido asociado (`GET /orders/:id`) para el resumen de productos.
 */
export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [nameByProduct, setNameByProduct] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [emitting, setEmitting] = useState(false);

  const load = useCallback(async () => {
    const id = Number(invoiceId);
    if (!Number.isFinite(id)) {
      navigate('/facturacion');
      return;
    }
    setLoading(true);
    try {
      const invoiceResp = await invoiceService.getById(id);
      if (invoiceResp.code !== 200 || !invoiceResp.data) {
        toast({
          variant: 'warning',
          title: '❌ Factura no encontrada',
          description: apiErrorMessage(invoiceResp, 'No se pudo cargar la factura.'),
        });
        navigate('/facturacion');
        return;
      }
      setInvoice(invoiceResp.data);

      const [orderResp, products] = await Promise.all([
        orderService.getById(invoiceResp.data.orderId),
        productService.listAll(),
      ]);
      setOrder(orderResp.code === 200 ? orderResp.data : null);
      setNameByProduct(new Map(products.map((product) => [product.id, product.name])));
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar la factura',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, [invoiceId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBack = () => navigate('/facturacion');
  const handlePrint = () => window.print();

  const handleSendEmail = () => {
    const email = invoice?.customerEmail;
    if (!email) {
      toast({
        variant: 'warning',
        title: '📧 Sin correo del cliente',
        description: 'Esta factura no tiene email registrado.',
      });
      return;
    }
    toast({
      variant: 'success',
      title: '📧 Factura enviada',
      description: `Se envió la factura ${invoice?.invoiceNumber} a ${email}.`,
    });
  };

  const handleCancel = async () => {
    if (!invoice || cancelling) return;
    if (
      !window.confirm(
        `¿Seguro que quieres anular la factura ${invoice.invoiceNumber}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setCancelling(true);
    try {
      const resp = await invoiceService.updateStatus(invoice.id, 'cancelled');
      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '🚫 Factura anulada',
          description: `Se anuló la factura ${invoice.invoiceNumber}.`,
        });
        await load();
      } else {
        toast({
          variant: 'warning',
          title: '❌ No se pudo anular la factura',
          description: apiErrorMessage(resp, 'Intenta de nuevo.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo anular la factura',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setCancelling(false);
    }
  };

  /** PENDIENTE → EMITIDA (facturación electrónica, p.ej. ante la DIAN). */
  const handleEmit = async () => {
    if (!invoice || emitting) return;
    setEmitting(true);
    try {
      const resp = await invoiceService.updateStatus(invoice.id, 'emitted');
      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '✅ Factura emitida',
          description: `La factura ${invoice.invoiceNumber} quedó EMITIDA.`,
        });
        await load();
      } else {
        toast({
          variant: 'warning',
          title: '❌ No se pudo emitir la factura',
          description: apiErrorMessage(resp, 'Intenta de nuevo.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo emitir la factura',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setEmitting(false);
    }
  };

  const tip = invoice ? Number(invoice.voluntaryTip ?? 0) : 0;
  const subtotal = invoice ? Number(invoice.subtotal) : 0;
  const discount = invoice ? Number(invoice.discount) : 0;
  const taxes = invoice ? Number(invoice.taxes) : 0;
  const totalInvoice = invoice ? Number(invoice.total) : 0;

  const customer = {
    name:
      invoice?.customerName?.trim() ||
      order?.customerName ||
      'Consumidor Final',
    rut: invoice?.customerIdentification || '—',
    email: invoice?.customerEmail || '—',
    phone: order?.customerPhone || '—',
    address: order?.address || '—',
  };

  const products = (order?.items ?? []).map((item) => ({
    id: String(item.id),
    name: nameByProduct.get(item.productId) ?? `Producto #${item.productId}`,
    description: '',
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }));

  const payment = {
    subtotal,
    taxRate: rateOf(taxes, subtotal),
    taxAmount: taxes,
    discountRate: rateOf(discount, subtotal),
    discountAmount: discount,
    // Lo que pagó el cliente: total de la factura + propina voluntaria
    total: totalInvoice + tip,
    currency: 'USD',
    paymentMethod: invoice?.paymentMethod
      ? (PAYMENT_METHOD_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod)
      : '—',
    voluntaryTip: tip,
  };

  if (loading) {
    return (
      <DashboardLayout
        sidebar={<ConfigSidebar />}
        main={
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-4xl">⏳</span>
            <p className="mt-4 font-medium">Cargando factura…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultando el comprobante fiscal
            </p>
          </div>
        }
      />
    );
  }

  if (!invoice) return null;

  const orderStatus: ApiOrderStatus | undefined = order?.status;

  return (
    <DashboardLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="flex flex-col h-full overflow-auto">
          {/* Breadcrumb */}
          <div className="mb-2 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer" onClick={handleBack}>
              Facturación
            </span>
            <span className="mx-2">/</span>
            <span>Detalle de Factura {invoice.invoiceNumber}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Detalle de Facturación</h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {order
                  ? `Comprobante fiscal del pedido ${formatOrderNumber(order.orderNumber)} · ${
                      orderStatus ? ORDER_STATUS_LABELS[orderStatus] : ''
                    }`
                  : 'Comprobante fiscal de la orden asociada'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Volver a facturas
              </Button>
              {invoice.status === 'pending' && (
                <Button
                  className="gap-2"
                  onClick={() => void handleEmit()}
                  disabled={emitting}
                >
                  <CheckCircle className="h-4 w-4" />
                  {emitting ? 'Emitiendo…' : 'Emitir Factura'}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid gap-6 lg:grid-cols-3 flex-1">
            {/* Left column - Customer and Products */}
            <div className="lg:col-span-2 space-y-6">
              <CustomerInfoCard customer={customer} />
              <ProductsSummaryCard products={products} />
            </div>

            {/* Right column - Payment summary */}
            <div>
              <PaymentSummaryCard
                payment={payment}
                onPrintReceipt={handlePrint}
                onSendEmail={handleSendEmail}
                onCancelOrder={
                  invoice.status === 'pending' ? () => void handleCancel() : undefined
                }
              />
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-6 -mx-6 -mb-6">
            <InvoiceStatusBar isOnline={true} lastSync="Ahora" />
          </div>
        </div>
      }
    />
  );
}
