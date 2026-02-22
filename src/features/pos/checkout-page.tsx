import { useNavigate } from 'react-router-dom';
import { GlobalHeader } from '@/components/common';
import { SaleSummarySidebar } from '@/components/pos/sale-summary-sidebar';
import { CheckoutInvoiceCard } from '@/components/pos/checkout-invoice-card';

// Mock data - would come from cart/order state
const mockSummary = {
  orderNumber: '204',
  tableNumber: 5,
  subtotal: 15247,
  discount: 0,
  taxRate: 21,
  total: 18450,
};

const mockInvoice = {
  invoiceNumber: '0001-00002384',
  invoiceType: 'FACTURA B',
  date: '25 Mayo, 2024',
  time: '14:50',
  business: {
    name: 'LA EMPANADERÍA',
    tagline: 'Sabor Tradicional Inc.',
    address: 'Av. Principal 1234',
    taxId: '30-71234567-9',
  },
  items: [
    {
      id: '1',
      name: 'Empanada de Carne (Frita)',
      description: 'Cocción tradicional',
      quantity: 12,
      unitPrice: 1200,
      total: 14400,
    },
    {
      id: '2',
      name: 'Empanada de Queso y Cebolla',
      description: 'Al horno',
      quantity: 3,
      unitPrice: 1150,
      total: 3450,
    },
    {
      id: '3',
      name: 'Salsa Picante Extra',
      description: 'Salsero 50ml',
      quantity: 2,
      unitPrice: 300,
      total: 600,
    },
  ],
  subtotal: 15247.93,
  taxRate: 21,
  taxAmount: 3202.07,
  total: 18450,
};

/**
 * Checkout page - Invoice detail before payment
 */
export function CheckoutPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handlePrint = () => {
    console.log('Printing invoice...');
  };

  const handleSendEmail = () => {
    console.log('Sending email...');
  };

  const handleEmitInvoice = () => {
    console.log('Emitting invoice...');
    // After emitting, could navigate back to POS or to a success page
    navigate('/');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Global Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <GlobalHeader />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Sale summary */}
        <aside className="hidden w-[280px] flex-shrink-0 lg:block">
          <SaleSummarySidebar summary={mockSummary} />
        </aside>

        {/* Main content - Invoice detail */}
        <main className="flex-1 overflow-auto p-6">
          <CheckoutInvoiceCard
            invoice={mockInvoice}
            onBack={handleBack}
            onPrint={handlePrint}
            onSendEmail={handleSendEmail}
            onEmitInvoice={handleEmitInvoice}
          />
        </main>
      </div>
    </div>
  );
}
