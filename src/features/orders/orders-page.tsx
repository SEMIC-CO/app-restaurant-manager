import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { POSLayout } from '@/app/layout';
import { AppHeader, ConfigSidebar, SearchInput } from '@/components/common';
import {
  Badge,
  Button,
} from '@/components/ui';
import {
  OrderDetailPanel,
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_BADGE_CLASSES,
  ORDER_TYPE_LABELS,
} from '@/components/pos';
import { useOrdersStore } from '@/store';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import type { Order, OrderType } from '@/types';

type TypeFilter = 'todas' | OrderType;

const TYPE_TAGS: Array<{ id: TypeFilter; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'mesa', label: 'Mesa' },
  { id: 'para-llevar', label: 'Para Llevar' },
  { id: 'domicilio', label: 'Domicilio' },
];

/**
 * Pedidos: listado de tarjetas (número, mesa, total) con filtro por tags de
 * tipo de orden y sección derecha con el detalle del pedido seleccionado.
 * El botón "Crear orden" abre la pantalla de creación (/pedidos/nuevo).
 */
export function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orders = useOrdersStore((state) => state.orders);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todas');
  const [search, setSearch] = useState('');
  // El pedido recién creado llega desde la pantalla de creación (router state)
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (location.state as { selectedOrderId?: string } | null)?.selectedOrderId ?? null,
  );

  // Conteo por tag para mostrar la cantidad en cada filtro
  const counts = useMemo(() => {
    const result: Record<TypeFilter, number> = { todas: orders.length, mesa: 0, 'para-llevar': 0, domicilio: 0 };
    orders.forEach((order) => {
      result[order.type] += 1;
    });
    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesType = typeFilter === 'todas' || order.type === typeFilter;
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        (order.customerName ?? '').toLowerCase().includes(query) ||
        (order.tableNumber !== undefined && String(order.tableNumber).toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }, [orders, typeFilter, search]);

  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;

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
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecciona un pedido para ver su detalle
                  </p>
                </div>
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar pedido o cliente..."
                  />
                </div>
              </div>

              {/* Filtro por tags de tipo de orden */}
              <div className="flex flex-wrap gap-2">
                {TYPE_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setTypeFilter(tag.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      typeFilter === tag.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {tag.label}
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-xs',
                        typeFilter === tag.id
                          ? 'bg-primary-foreground/20'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {counts[tag.id]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tarjetas de pedidos */}
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
                  <span className="text-4xl">🧾</span>
                  <p className="mt-4 font-medium">
                    {orders.length === 0 ? 'Aún no hay pedidos' : 'No hay pedidos con este filtro'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {orders.length === 0
                      ? 'Crea tu primer pedido con el botón "Crear orden".'
                      : 'Prueba con otro tag o limpia la búsqueda.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      selected={order.id === selectedId}
                      onSelect={() => setSelectedId(order.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          }
          sidebar={
            <div className="flex h-full min-h-0 flex-col">
              {/* Botón para abrir la pantalla de creación */}
              <div className="shrink-0 border-b p-4">
                <Button className="w-full gap-2" size="lg" onClick={() => navigate('/pedidos/nuevo')}>
                  <Plus className="h-4 w-4" />
                  Crear orden
                </Button>
              </div>

              {/* Detalle del pedido seleccionado */}
              {selectedOrder ? (
                <div className="min-h-0 flex-1">
                  <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedId(null)} />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
                  <span className="text-4xl">🧾</span>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Detalle del pedido
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Haz click en un pedido de la lista para ver su información aquí.
                  </p>
                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}

/** Tarjeta de pedido: número, tipo, estado, mesa, cliente y total. */
function OrderCard({
  order,
  selected,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  onSelect: () => void;
}) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md',
        selected
          ? 'border-primary ring-2 ring-primary/30'
          : 'hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-lg font-bold text-primary">
          #{order.orderNumber.replace('ORD-', '')}
        </span>
        <span className="text-lg font-bold text-foreground">{formatCurrency(order.total)}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`px-2 py-1 text-[10px] uppercase font-medium ${ORDER_TYPE_BADGE_CLASSES[order.type]}`}
        >
          {ORDER_TYPE_LABELS[order.type]}
        </Badge>
        <Badge
          variant="outline"
          className={`px-2 py-1 text-[10px] uppercase font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm">
        <div className="min-w-0 space-y-0.5 text-left">
          <p className="font-medium">Mesa: {order.tableNumber ?? 'Sin mesa'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {order.customerName || 'Sin cliente'}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-muted-foreground">
          <p>{units} producto(s)</p>
          <p>
            {new Date(order.createdAt).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </button>
  );
}
