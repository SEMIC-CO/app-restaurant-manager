import { useState } from "react";
import {
  KitchenSidebar,
  TicketCard,
  TicketFilters,
} from "@/components/kitchen";
import type { Order } from "@/types";
import { ConfigSidebar, AppHeader } from "@/components/common";

// Mock data for kitchen orders
const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-204",
    items: [
      {
        id: "1",
        productId: "1",
        productName: "Carne",
        quantity: 3,
        unitPrice: 1.5,
        subtotal: 4.5,
      },
      {
        id: "2",
        productId: "3",
        productName: "Queso",
        quantity: 2,
        unitPrice: 1.2,
        subtotal: 2.4,
      },
    ],
    subtotal: 6.9,
    tax: 0.69,
    total: 7.59,
    status: "preparing",
    type: "para-llevar",
    tableNumber: 5,
    createdAt: new Date(Date.now() - 18 * 60000), // 18 min ago
    updatedAt: new Date(),
  },
  {
    id: "2",
    orderNumber: "ORD-205",
    items: [
      {
        id: "3",
        productId: "2",
        productName: "Pollo",
        quantity: 6,
        unitPrice: 1.5,
        subtotal: 9,
      },
      {
        id: "4",
        productId: "5",
        productName: "Bebida (Cola)",
        quantity: 2,
        unitPrice: 1,
        subtotal: 2,
      },
    ],
    subtotal: 11,
    tax: 1.1,
    total: 12.1,
    status: "preparing",
    type: "para-llevar",
    createdAt: new Date(Date.now() - 12 * 60000), // 12 min ago
    updatedAt: new Date(),
  },
  {
    id: "3",
    orderNumber: "ORD-206",
    items: [
      {
        id: "5",
        productId: "7",
        productName: "Humita",
        quantity: 1,
        unitPrice: 1.2,
        subtotal: 1.2,
      },
      {
        id: "6",
        productId: "1",
        productName: "Carne",
        quantity: 1,
        unitPrice: 1.5,
        subtotal: 1.5,
      },
      {
        id: "7",
        productId: "2",
        productName: "Pollo",
        quantity: 1,
        unitPrice: 1.5,
        subtotal: 1.5,
      },
    ],
    subtotal: 4.2,
    tax: 0.42,
    total: 4.62,
    status: "preparing",
    type: "para-llevar",
    tableNumber: 2,
    createdAt: new Date(Date.now() - 2 * 60000), // 2 min ago
    updatedAt: new Date(),
  },
  {
    id: "4",
    orderNumber: "ORD-207",
    items: [
      {
        id: "8",
        productId: "7",
        productName: "Humita",
        quantity: 10,
        unitPrice: 1.2,
        subtotal: 12,
      },
      {
        id: "9",
        productId: "3",
        productName: "Queso",
        quantity: 5,
        unitPrice: 1.2,
        subtotal: 6,
      },
    ],
    subtotal: 18,
    tax: 1.8,
    total: 19.8,
    status: "preparing",
    type: "domicilio",
    createdAt: new Date(Date.now() - 45000), // 45 sec ago
    updatedAt: new Date(),
  },
  {
    id: "5",
    orderNumber: "ORD-208",
    items: [
      {
        id: "10",
        productId: "8",
        productName: "Carne Picante",
        quantity: 4,
        unitPrice: 1.5,
        subtotal: 6,
      },
      {
        id: "11",
        productId: "1",
        productName: "Carne Suave",
        quantity: 4,
        unitPrice: 1.5,
        subtotal: 6,
      },
    ],
    subtotal: 12,
    tax: 1.2,
    total: 13.2,
    status: "preparing",
    type: "para-llevar",
    tableNumber: 10,
    createdAt: new Date(Date.now() - 30000), // 30 sec ago
    updatedAt: new Date(),
  },
];

const flavorCounts = [
  { name: "Carne", count: 12 },
  { name: "Pollo", count: 10 },
  { name: "Queso", count: 8 },
  { name: "Humita", count: 12 },
];

const ticketFilters = [
  { type: "all" as const, label: "Todos", count: 12 },
  { type: "para-llevar" as const, label: "Para Llevar" },
  { type: "mesa" as const, label: "Mesa" },
  { type: "domicilio" as const, label: "Domicilio" },
];

/**
 * Kitchen page - Order queue management for kitchen staff
 */
export function KitchenPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [orders, setOrders] = useState(mockOrders);

  const filteredOrders =
    activeFilter === "all"
      ? orders
      : orders.filter((o) => o.type === activeFilter);

  const handleMarkReady = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    console.log("Order marked ready:", orderId);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      {/* 1) Navigation sidebar (lg+, al lado del AppHeader) */}
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      {/* 2) Right column: AppHeader + inner row (kitchen sidebar + tickets) */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* 2a) Kitchen sidebar - contador de pendientes (lg+) */}
          <aside className="hidden w-[200px] flex-shrink-0 bg-primary text-primary-foreground lg:block h-full overflow-y-auto">
            <KitchenSidebar
              totalPending={42}
              flavorCounts={flavorCounts}
              stationName="Cocina Principal"
              shiftName="Turno Tarde"
            />
          </aside>

          {/* 2b) Ticket grid (main) */}
          <main className="flex-1 overflow-auto p-6 min-w-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Cola de Tickets</h2>
                <TicketFilters
                  filters={ticketFilters}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredOrders.map((order) => (
                  <TicketCard
                    key={order.id}
                    order={order}
                    onMarkReady={handleMarkReady}
                  />
                ))}
              </div>

              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl">✅</span>
                  <p className="mt-4 text-lg font-medium">¡Todo al día!</p>
                  <p className="text-muted-foreground">
                    No hay pedidos pendientes
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
