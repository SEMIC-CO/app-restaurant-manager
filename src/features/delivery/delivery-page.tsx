import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { 
  DeliveryStats, 
  DeliverySearch, 
  DeliverySection,
  DeliveryOrderCard,
} from '@/components/delivery';
import { Button } from '@/components/ui';
import type { Order } from '@/types';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';

// Mock data
const mockReadyOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2304',
    items: [
      { id: '1', productId: '1', productName: 'Carne Suave', quantity: 3, unitPrice: 1.5, subtotal: 4.5 },
      { id: '2', productId: '4', productName: 'Jamón y Queso', quantity: 2, unitPrice: 1.3, subtotal: 2.6 },
    ],
    subtotal: 6.82,
    tax: 0.68,
    total: 7.5,
    status: 'paid',
    type: 'para-llevar',
    tableNumber: 3,
    customerName: 'Juan Pérez',
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    orderNumber: 'ORD-2305',
    items: [
      { id: '3', productId: '8', productName: 'Variadas (Promo)', quantity: 12, unitPrice: 1.25, subtotal: 15 },
      { id: '4', productId: '6', productName: 'Bebida 1.5L', quantity: 1, unitPrice: 2.5, subtotal: 2.5 },
    ],
    subtotal: 15.91,
    tax: 1.59,
    total: 17.5,
    status: 'paid',
    type: 'para-llevar',
    customerName: 'María González',
    createdAt: new Date(Date.now() - 12 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    orderNumber: 'ORD-2306',
    items: [
      { id: '5', productId: '9', productName: 'Empanadas Cocktail', quantity: 50, unitPrice: 0.9, subtotal: 45 },
    ],
    subtotal: 40.91,
    tax: 4.09,
    total: 45,
    status: 'pending',
    type: 'domicilio',
    customerName: 'Empresa Tech S.A.',
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(),
  },
];

const mockPendingInvoice: Order[] = [
  {
    id: '4',
    orderNumber: 'ORD-2301',
    items: [
      { id: '6', productId: '2', productName: 'Pollo', quantity: 6, unitPrice: 1.5, subtotal: 9 },
      { id: '7', productId: '10', productName: 'Pino', quantity: 6, unitPrice: 1.5, subtotal: 9 },
    ],
    subtotal: 16.36,
    tax: 1.64,
    total: 18,
    status: 'delivered',
    type: 'para-llevar',
    customerName: 'Carlos Rodriguez',
    createdAt: new Date(Date.now() - 30 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '5',
    orderNumber: 'ORD-2302',
    items: [
      { id: '8', productId: '11', productName: 'Camarón Queso', quantity: 2, unitPrice: 2, subtotal: 4 },
    ],
    subtotal: 3.64,
    tax: 0.36,
    total: 4,
    status: 'delivered',
    type: 'para-llevar',
    customerName: 'Ana Silva',
    createdAt: new Date(Date.now() - 45 * 60000),
    updatedAt: new Date(),
  },
];

/**
 * Delivery control page - Manage order handoff and invoicing
 */
export function DeliveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [readyOrders] = useState(mockReadyOrders);
  const [pendingInvoice] = useState(mockPendingInvoice);

  const handleDeliver = (orderId: string) => {
    console.log('Delivering order:', orderId);
  };

  const handleViewDetails = (orderId: string) => {
    console.log('Viewing order:', orderId);
  };

  const handleGenerateInvoice = (orderId: string) => {
    console.log('Generating invoice:', orderId);
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Control de Entregas</h1>
              <p className="text-muted-foreground">
                Gestiona el flujo de pedidos desde la cocina hasta el cliente. 
                Factura los pedidos entregados con un solo clic.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Hoy, 24 Oct
            </Button>
          </div>

          {/* Stats */}
          <DeliveryStats
            readyCount={12}
            pendingInvoice={5}
            invoicedToday={45}
          />

          {/* Search */}
          <DeliverySearch
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {/* Two column layout */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Ready for delivery */}
            <DeliverySection
              title="Listos para Entrega"
              count={readyOrders.length}
              indicatorColor="primary"
              action={
                <Button variant="link" className="text-sm">
                  Ver todos
                </Button>
              }
            >
              {readyOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="ready"
                  onDeliver={handleDeliver}
                />
              ))}
            </DeliverySection>

            {/* Pending invoice */}
            <DeliverySection
              title="Por Facturar"
              count={pendingInvoice.length}
              indicatorColor="secondary"
              action={
                <Button variant="link" className="text-sm text-muted-foreground">
                  Ver historial
                </Button>
              }
            >
              {pendingInvoice.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="pending-invoice"
                  onViewDetails={handleViewDetails}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              ))}
            </DeliverySection>
          </div>
        </div>
      }
    />
  );
}
