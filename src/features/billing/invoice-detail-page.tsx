import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/app/layout/dashboard-layout';
import { Button, Badge } from '@/components/ui';
import { CustomerInfoCard } from '@/components/billing/customer-info-card';
import { ProductsSummaryCard } from '@/components/billing/products-summary-card';
import { PaymentSummaryCard } from '@/components/billing/payment-summary-card';
import { InvoiceStatusBar } from '@/components/billing/invoice-status-bar';

// Mock data - would come from API based on invoiceId
const mockInvoiceDetail = {
  id: '1',
  invoiceNumber: 'INV-2023-001',
  orderNumber: '#9821',
  status: 'draft' as const,
  customer: {
    name: 'Juan Pérez Rodríguez',
    rut: '12.345.678-9',
    email: 'juan.perez@email.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Providencia 1234, Santiago',
  },
  products: [
    {
      id: '1',
      name: 'Empanada de Pino XL',
      description: 'Horno - Carne Vacuno',
      quantity: 10,
      unitPrice: 2500,
      subtotal: 25000,
    },
    {
      id: '2',
      name: 'Empanada Queso Champiñon',
      description: 'Frita - Vegetariana',
      quantity: 5,
      unitPrice: 2200,
      subtotal: 11000,
    },
    {
      id: '3',
      name: 'Bebida 1.5L',
      description: 'Coca Cola Zero',
      quantity: 2,
      unitPrice: 1800,
      subtotal: 3600,
    },
  ],
  payment: {
    subtotal: 39600,
    taxRate: 19,
    taxAmount: 7524,
    discountRate: 5,
    discountAmount: 1980,
    total: 45144,
    currency: 'CLP',
    paymentMethod: 'Tarjeta de Débito (Transbank)',
  },
  branch: {
    name: 'Sucursal Providencia',
    supportPhone: '800-EMPANADA',
  },
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="warning">BORRADOR</Badge>;
    case 'paid':
      return <Badge variant="success">PAGADA</Badge>;
    case 'pending':
      return <Badge variant="secondary">PENDIENTE</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/**
 * Invoice detail page - Shows full invoice information
 */
export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  // In real app, fetch invoice data based on invoiceId
  const invoice = mockInvoiceDetail;

  const handleBack = () => {
    navigate('/facturacion');
  };

  const handleEmitInvoice = () => {
    console.log('Emitting invoice:', invoiceId);
  };

  const handleEditCustomer = () => {
    console.log('Editing customer data');
  };

  const handlePrintReceipt = () => {
    console.log('Printing receipt');
  };

  const handleSendEmail = () => {
    console.log('Sending email');
  };

  const handleCancelOrder = () => {
    console.log('Canceling order');
  };

  return (
    <DashboardLayout
      main={
        <div className="flex flex-col h-full">
          {/* Breadcrumb */}
          <div className="mb-2 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer" onClick={handleBack}>
              Facturación
            </span>
            <span className="mx-2">/</span>
            <span>Detalle de Factura #{invoice.invoiceNumber}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Detalle de Facturación</h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-muted-foreground">
                Revisión y emisión del comprobante fiscal para la orden {invoice.orderNumber}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Volver a pedidos
              </Button>
              <Button className="gap-2" onClick={handleEmitInvoice}>
                <CheckCircle className="h-4 w-4" />
                Emitir Factura
              </Button>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid gap-6 lg:grid-cols-3 flex-1">
            {/* Left column - Customer and Products */}
            <div className="lg:col-span-2 space-y-6">
              <CustomerInfoCard 
                customer={invoice.customer} 
                onEdit={handleEditCustomer}
              />
              <ProductsSummaryCard products={invoice.products} />
            </div>

            {/* Right column - Payment summary */}
            <div>
              <PaymentSummaryCard 
                payment={invoice.payment}
                onPrintReceipt={handlePrintReceipt}
                onSendEmail={handleSendEmail}
                onCancelOrder={handleCancelOrder}
              />
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-6 -mx-6 -mb-6">
            <InvoiceStatusBar 
              isOnline={true}
              lastSync="Hace 2 minutos"
              branch={invoice.branch}
            />
          </div>
        </div>
      }
    />
  );
}
