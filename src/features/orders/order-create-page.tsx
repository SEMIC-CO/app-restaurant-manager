import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { POSLayout } from '@/app/layout';
import {
  AppHeader,
  CategoryTabs,
  ConfigSidebar,
  SearchInput,
} from '@/components/common';
import { Button } from '@/components/ui';
import { OrderCreateSidebar, ORDER_TYPE_LABELS, ProductGrid } from '@/components/pos';
import { toast, useCategories, useFloorTables, useProducts } from '@/hooks';
import { orderService } from '@/services';
import { useOrdersStore } from '@/store';
import type {
  ApiOrder,
  FloorTable,
  Order,
  OrderItem,
  OrderType,
  Product,
} from '@/types';

/** Convierte la orden del backend al modelo del store (con nombres de producto). */
function mapApiOrder(api: ApiOrder, type: OrderType, nameByProduct: Map<number, string>): Order {
  return {
    id: String(api.id),
    orderNumber: api.orderNumber,
    customerName: api.customerName ?? undefined,
    tableNumber: api.tableNumber ? Number(api.tableNumber) : undefined,
    status: api.status,
    subtotal: Number(api.subtotal),
    tax: 0,
    total: Number(api.total),
    type,
    items: api.items.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      productId: String(item.productId),
      productName: nameByProduct.get(item.productId) ?? '',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    createdAt: new Date(api.orderDatetime),
    updatedAt: new Date(),
  };
}

/**
 * Pantalla de creación de pedidos (se abre desde Pedidos > "Crear orden"):
 * catálogo por categorías a la izquierda + formulario/carrito a la derecha.
 */
export function OrderCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Productos por categoría (mismo flujo que Caja)
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { categories } = useCategories();
  const { products, loading } = useProducts(activeCategory);

  // Mesas de la sede + órdenes activas (ocupada/libre)
  const { tables, refresh: refreshTables } = useFloorTables();

  // Pedidos creados en esta sesión (la lista de Pedidos los muestra)
  const addOrder = useOrdersStore((state) => state.addOrder);

  // Formulario del nuevo pedido
  const [orderType, setOrderType] = useState<OrderType>('para-llevar');
  const [customerName, setCustomerName] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [creating, setCreating] = useState(false);

  // La mesa llega desde /mesas (TablesPage navega con state.mesa)
  useEffect(() => {
    const incoming = (location.state as { mesa?: FloorTable } | null)?.mesa;
    if (incoming) {
      setSelectedTableId(incoming.id);
      setOrderType('mesa');
    }
  }, [location.state]);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  // Carrito: agregar producto (sumar cantidad si ya existe)
  const handleAddToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const quantity = existing.quantity + 1;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity, subtotal: item.unitPrice * quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== itemId) return [item];
        if (quantity <= 0) return [];
        return [{ ...item, quantity, subtotal: item.unitPrice * quantity }];
      }),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCreateOrder = async () => {
    if (creating || items.length === 0) return;

    if (orderType === 'mesa' && !selectedTable) {
      toast({
        variant: 'warning',
        title: '🪑 Selecciona una mesa',
        description: 'Los pedidos de tipo Mesa requieren una mesa asignada.',
      });
      return;
    }

    setCreating(true);
    try {
      const resp = await orderService.create({
        customerName: customerName.trim() || undefined,
        tableNumber: selectedTable?.name,
        idTable: selectedTable?.id,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
        })),
        orderType,
        // El backend no tiene columna para el tipo de orden (lo descarta el
        // whitelist del ValidationPipe), así que se replica en las notas.
        notes: `Tipo de orden: ${ORDER_TYPE_LABELS[orderType]}`,
      });

      if (resp.code === 200 || resp.code === 201) {
        const nameByProduct = new Map(
          items.map((item) => [Number(item.productId), item.productName]),
        );
        addOrder(mapApiOrder(resp.data, orderType, nameByProduct));

        toast({
          variant: 'success',
          title: '✅ Pedido creado',
          description: `El pedido ${resp.data.orderNumber} fue registrado correctamente.`,
        });

        void refreshTables();
        // Volver a la lista de pedidos con el pedido recién creado seleccionado
        navigate('/pedidos', { state: { selectedOrderId: String(resp.data.id) } });
      } else {
        const detail = Array.isArray(resp.data)
          ? resp.data.join(' · ')
          : resp.msg || 'Revisa los datos e inténtalo de nuevo.';
        toast({
          variant: 'warning',
          title: '❌ No se pudo crear el pedido',
          description: detail,
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo crear el pedido',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30 relative">
      <aside className="hidden w-[220px] flex-shrink-0 border-r bg-card lg:block h-full overflow-y-auto">
        <ConfigSidebar />
      </aside>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <AppHeader />
        </div>

        <POSLayout
          main={
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate('/pedidos')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a pedidos
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">Nuevo Pedido</h1>
                    <p className="text-sm text-muted-foreground">
                      Selecciona los productos de la carta
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar producto..."
                  />
                </div>
              </div>

              <CategoryTabs
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                loading={loading}
              />
            </div>
          }
          sidebar={
            <OrderCreateSidebar
              orderType={orderType}
              onOrderTypeChange={setOrderType}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              selectedTableId={selectedTableId}
              onTableChange={setSelectedTableId}
              tables={tables}
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onSubmit={handleCreateOrder}
              submitting={creating}
            />
          }
        />
      </div>
    </div>
  );
}
