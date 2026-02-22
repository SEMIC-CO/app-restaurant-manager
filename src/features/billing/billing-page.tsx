import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BillingLayout } from '@/app/layout/billing-layout';
import { 
  BillingSidebar, 
  InvoiceTable, 
  BillingFooter,
  type Invoice 
} from '@/components/billing';

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: '0001-00002384',
    date: '25 Mayo, 2024',
    time: '14:50',
    customerName: 'Juan Pérez',
    status: 'paid',
    total: 18450,
  },
  {
    id: '2',
    invoiceNumber: '0001-00002383',
    date: '25 Mayo, 2024',
    time: '14:15',
    customerName: 'María García',
    status: 'pending',
    total: 12200,
  },
  {
    id: '3',
    invoiceNumber: '0001-00002382',
    date: '25 Mayo, 2024',
    time: '13:40',
    customerName: 'Consumidor Final',
    status: 'paid',
    total: 5650,
  },
  {
    id: '4',
    invoiceNumber: '0001-00002381',
    date: '25 Mayo, 2024',
    time: '13:05',
    customerName: 'Ricardo Gomez',
    status: 'paid',
    total: 24900,
  },
  {
    id: '5',
    invoiceNumber: '0001-00002380',
    date: '25 Mayo, 2024',
    time: '12:30',
    customerName: 'Ana Lopez',
    status: 'paid',
    total: 8120,
  },
];

/**
 * Billing page - Invoice history and management
 */
export function BillingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activePeriod, setActivePeriod] = useState('today');

  const handleViewDetails = (invoiceId: string) => {
    navigate(`/facturacion/${invoiceId}`);
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
  };

  const handlePrintReport = () => {
    console.log('Printing report...');
  };

  // Filter invoices by search query
  const filteredInvoices = searchQuery
    ? mockInvoices.filter(
        (inv) =>
          inv.invoiceNumber.includes(searchQuery) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockInvoices;

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <BillingLayout
      sidebar={
        <BillingSidebar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />
      }
      main={
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Listado Histórico de Facturas</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-600">Terminal Conectada</span>
            </div>
          </div>

          {/* Invoice table */}
          <InvoiceTable
            invoices={filteredInvoices}
            onViewDetails={handleViewDetails}
          />
        </div>
      }
      footer={
        <BillingFooter
          totalAmount={totalAmount}
          invoiceCount={filteredInvoices.length}
          onExportExcel={handleExportExcel}
          onPrintReport={handlePrintReport}
        />
      }
    />
  );
}
