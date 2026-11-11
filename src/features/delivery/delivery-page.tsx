import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  DeliveryStats,
  DeliverySearch,
  DeliverySection,
  DeliveryOrderCard,
} from '@/components/delivery';
import { TicketFilters } from '@/components/kitchen';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import { toast, useOrderEvents } from '@/hooks';
import { orderService, productService } from '@/services';
import { mapApiOrder, toISODate } from '@/utils';
import type { Order, OrderStatus } from '@/types';

/** Refresco de la cola de entregas (pedidos que entran/salen desde otras vistas). */
const POLL_INTERVAL_MS = 30000;

/** Filtro de la vista del día: todos los pedidos o un estado en particular. */
type DayFilter = 'all' | OrderStatus;

function apiErrorMessage(resp: { code: number; msg: string; data: unknown }, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

/**
 * Control de entregas con datos reales de la sede (solo el día en curso):
 *
 * - **Listos para Entrega**: los pedidos que la cocina deja en `ready`
 *   aparecen AL INSTANTE (Socket.IO + polling), ordenados por quien lleva
 *   más esperando; el botón "Entregar Pedido" los pasa a `delivered`.
 * - **Todos los pedidos de hoy**: los pedidos del día en **tarjetas** con
 *   filtros por estado (Todos / Pendientes / En preparación / Listos /
 *   Entregados / Pagados) y sus conteos reales.
 */
export function DeliveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  /** Todos los pedidos del día, en orden de llegada. */
  const [dayOrders, setDayOrders] = useState<Order[]>([]);
  /** Total real del día en el backend (puede superar lo que se trajo). */
  const [dayTotal, setDayTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  /** Id del pedido que tiene una acción en curso (deshabilita los botones). */
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  /** Filtro por estado de la vista del día. */
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');

  const load = useCallback(async () => {
    try {
      // Un solo listado: TODOS los pedidos del día (sin filtro de estado).
      const today = toISODate();
      const [ordersResp, products] = await Promise.all([
        orderService.list({ limit: 100, dateFrom: today, dateTo: today }),
        productService.listAll(),
      ]);

      if (ordersResp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar entregas',
          description: apiErrorMessage(ordersResp, 'No se pudieron cargar los pedidos.'),
        });
        return;
      }

      const nameByProduct = new Map(
        products.map((product) => [product.id, product.name]),
      );
      // El día se lee en orden de llegada: primero el más antiguo.
      setDayOrders(
        ordersResp.data.items
          .map((order) => mapApiOrder(order, nameByProduct))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      );
      setDayTotal(ordersResp.data.total);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar entregas',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Tiempo real (Socket.IO): cuando la cocina marca un pedido como listo
  // (o entra / sale / cambia uno) la vista se recarga al instante.
  useOrderEvents({
    onOrderCreated: () => void load(),
    onOrderUpdated: () => void load(),
    onOrderDeleted: () => void load(),
  });

  const readyOrders = useMemo(
    () => dayOrders.filter((order) => order.status === 'ready'),
    [dayOrders],
  );
  const deliveredToday = useMemo(
    () => dayOrders.filter((order) => order.status === 'delivered').length,
    [dayOrders],
  );

  /** Conteos reales por estado (pestañas de filtro). */
  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      paid: 0,
      cancelled: 0,
    };
    dayOrders.forEach((order) => {
      counts[order.status] += 1;
    });
    return counts;
  }, [dayOrders]);

  const dayFilters: { type: DayFilter; label: string; count: number }[] =
    useMemo(
      () => [
        { type: 'all', label: 'Todos', count: dayOrders.length },
        { type: 'pending', label: 'Pendientes', count: statusCounts.pending },
        { type: 'preparing', label: 'En preparación', count: statusCounts.preparing },
        { type: 'ready', label: 'Listos', count: statusCounts.ready },
        { type: 'delivered', label: 'Entregados', count: statusCounts.delivered },
        { type: 'paid', label: 'Pagados', count: statusCounts.paid },
      ],
      [dayOrders, statusCounts],
    );

  // Búsqueda por número de pedido o nombre del cliente.
  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = useCallback(
    (order: Order) =>
      query === '' ||
      order.orderNumber.toLowerCase().includes(query) ||
      order.id.includes(query) ||
      (order.customerName ?? '').toLowerCase().includes(query),
    [query],
  );

  const filteredReady = useMemo(
    () => readyOrders.filter(matchesSearch),
    [readyOrders, matchesSearch],
  );
  const filteredDayOrders = useMemo(
    () =>
      dayOrders.filter(
        (order) =>
          (dayFilter === 'all' || order.status === dayFilter) &&
          matchesSearch(order),
      ),
    [dayOrders, dayFilter, matchesSearch],
  );

  /** "Entregar Pedido": `ready` → `delivered` (matriz de estados del backend). */
  const handleDeliver = async (orderId: string) => {
    if (updatingId) return;
    const order = dayOrders.find((item) => item.id === orderId);
    if (!order || order.status !== 'ready') return;

    setUpdatingId(orderId);
    try {
      const resp = await orderService.update(Number(orderId), { status: 'delivered' });
      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '✅ Pedido entregado',
          description: `El pedido ${order.orderNumber} quedó como entregado.`,
        });
        await load();
      } else {
        toast({
          variant: 'warning',
          title: '❌ No se pudo entregar el pedido',
          description: apiErrorMessage(resp, 'Intenta de nuevo.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo entregar el pedido',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const isLoadingFirstTime = loading && dayOrders.length === 0;

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Control de Entregas</h1>
              <p className="text-muted-foreground">
                Los pedidos que la cocina deja listos aparecen aquí al instante.
                Márkalos como entregados y revisa el día completo.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {/* `AAAA-MM-DD` → `DD/MM/AAAA` */}
              Hoy, {toISODate().split('-').reverse().join('/')}
            </div>
          </div>

          {/* Stats (reales del día) */}
          <DeliveryStats
            readyCount={readyOrders.length}
            deliveredToday={deliveredToday}
            totalToday={dayTotal}
          />

          {/* Search */}
          <DeliverySearch value={searchQuery} onChange={setSearchQuery} />

          {isLoadingFirstTime ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl">⏳</span>
              <p className="mt-4 text-lg font-medium">Cargando pedidos…</p>
              <p className="text-muted-foreground">
                Consultando los pedidos de la sede
              </p>
            </div>
          ) : (
            <>
              {/* Listos para entrega (ready → delivered) */}
              <DeliverySection
                title="Listos para Entrega"
                count={filteredReady.length}
                indicatorColor="primary"
              >
                {filteredReady.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {query
                      ? 'Sin pedidos listos que coincidan con la búsqueda.'
                      : 'La cocina aún no ha marcado pedidos como listos hoy.'}
                  </p>
                ) : (
                  filteredReady.map((order) => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      busy={updatingId === order.id}
                      onDeliver={handleDeliver}
                    />
                  ))
                )}
              </DeliverySection>

              {/* Todos los pedidos del día, en tarjetas y con filtros */}
              <DeliverySection
                title="Todos los pedidos de hoy"
                count={filteredDayOrders.length}
                indicatorColor="secondary"
                action={
                  <TicketFilters
                    filters={dayFilters}
                    activeFilter={dayFilter}
                    onFilterChange={(filter) => setDayFilter(filter as DayFilter)}
                  />
                }
              >
                {filteredDayOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {query
                      ? 'Ningún pedido del día coincide con la búsqueda.'
                      : dayFilter === 'all'
                        ? 'Todavía no hay pedidos hoy.'
                        : 'No hay pedidos con este estado hoy.'}
                  </p>
                ) : (
                  filteredDayOrders.map((order) => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      busy={updatingId === order.id}
                      onDeliver={handleDeliver}
                    />
                  ))
                )}
              </DeliverySection>

              {dayTotal > dayOrders.length && (
                <p className="text-sm text-muted-foreground">
                  Mostrando {dayOrders.length} de {dayTotal} pedidos del día.
                </p>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
