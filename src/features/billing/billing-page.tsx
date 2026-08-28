import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BillingSidebar,
  InvoiceTable,
  BillingFooter,
  type Invoice,
} from "@/components/billing";
import { ConfigSidebar, AppHeader } from "@/components/common";

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "0001-00002384",
    date: "25 Mayo, 2024",
    time: "14:50",
    customerName: "Juan Pérez",
    status: "paid",
    total: 18450,
  },
  {
    id: "2",
    invoiceNumber: "0001-00002383",
    date: "25 Mayo, 2024",
    time: "14:15",
    customerName: "María García",
    status: "pending",
    total: 12200,
  },
  {
    id: "3",
    invoiceNumber: "0001-00002382",
    date: "25 Mayo, 2024",
    time: "13:40",
    customerName: "Consumidor Final",
    status: "paid",
    total: 5650,
  },
  {
    id: "4",
    invoiceNumber: "0001-00002381",
    date: "25 Mayo, 2024",
    time: "13:05",
    customerName: "Ricardo Gomez",
    status: "paid",
    total: 24900,
  },
  {
    id: "5",
    invoiceNumber: "0001-00002380",
    date: "25 Mayo, 2024",
    time: "12:30",
    customerName: "Ana Lopez",
    status: "paid",
    total: 8120,
  },
];

/**
 * Billing page - Estructura row única (sin doble wrap):
 *   [Aside Nav (lg+) 220px] | [col AppHeader | row (Aside métodos pago + main+footer)]
 */
export function BillingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePeriod, setActivePeriod] = useState("today");

  const handleViewDetails = (invoiceId: string) => {
    navigate(`/facturacion/${invoiceId}`);
  };

  const handleExportExcel = () => console.log("Exporting to Excel...");
  const handlePrintReport = () => console.log("Printing report...");

  const filteredInvoices = searchQuery
    ? mockInvoices.filter(
      (inv) =>
        inv.invoiceNumber.includes(searchQuery) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : mockInvoices;

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      {/* 1) Navigation sidebar (lg+, al lado del header) */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      {/* 2) Right column: AppHeader + content row */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        {/* Inner content row: (BillingSidebar métodos + main/column) */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* 2a) Billing sidebar - métodos de pago (lg+) */}
          <aside className="hidden w-[240px] flex-shrink-0 lg:block h-full overflow-y-auto">
            <BillingSidebar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
            />
          </aside>

          {/* 2b) Main + footer en columna */}
          <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
            <main className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">
                    Listado Histórico de Facturas
                  </h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-600">Terminal Conectada</span>
                  </div>
                </div>

                <InvoiceTable
                  invoices={filteredInvoices}
                  onViewDetails={handleViewDetails}
                />
              </div>
            </main>

            <footer className="flex-shrink-0">
              <BillingFooter
                totalAmount={totalAmount}
                invoiceCount={filteredInvoices.length}
                onExportExcel={handleExportExcel}
                onPrintReport={handlePrintReport}
              />
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
