import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { POSLayout } from '@/app/layout';
import { AppHeader, ConfigSidebar, FilterTabs, SearchInput, SideDrawer } from '@/components/common';
import { Button } from '@/components/ui';
import {
  OrderCard,
  OrderDetailPanel,
} from '@/components/pos';
import { toast, useMediaQuery } from '@/hooks';
import { orderService, productService } from '@/services';
import { useOrdersStore } from '@/store';
import { localDayUtcRange, mapApiOrder } from '@/utils';
import type { Order, OrderType, ApiResponse } from '@/types';

type TypeFilter = 'todas' | OrderType;

const TYPE_TAGS: Array<{ id: TypeFilter; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'mesa', label: 'Mesa' },
  { id: 'para-llevar', label: 'Para Llevar' },
  { id: 'domicilio', label: 'Domicilio' },
];

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

/** Órdenes finalizadas: sin edición ni cancelación. */
function isFinalOrder(order: Order): boolean {
  return (
    order.status === 'delivered' ||
    order.status === 'paid' ||
    order.status === 'cancelled'
  );
}

/**
 * Pedidos: listado de tarjetas (número, mesa, total) con filtro por tags de
 * tipo de orden y sección derecha con el detalle del pedido seleccionado.
 * El botón "Crear pedido" abre la pantalla de creación (/pedidos/nuevo).
 */
export function OrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orders = useOrdersStore((state) => state.orders);
  const setOrders = useOrdersStore((state) => state.setOrders);
  const updateOrderStatus = useOrdersStore((state) => state.updateOrderStatus);

  // En pantallas < lg el panel derecho de detalle no existe (POSLayout lo
  // oculta con `hidden lg:block`): el detalle se abre como drawer al tocar
  // una tarjeta de pedido.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // El pedido recién creado llega desde la pantalla de creación (router state)
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (location.state as { selectedOrderId?: string } | null)?.selectedOrderId ?? null,
  );
  // Drawer del detalle (solo móvil/tablet): abierto si se llegó con un pedido
  // recién creado seleccionado.
  const [detailOpen, setDetailOpen] = useState(
    () =>
      !isDesktop &&
      Boolean((location.state as { selectedOrderId?: string } | null)?.selectedOrderId),
  );

  // Si la ventana crece a escritorio vuelve el panel fijo: se cierra el
  // drawer para no dejarlo abierto por detrás.
  useEffect(() => {
    if (isDesktop && detailOpen) setDetailOpen(false);
  }, [isDesktop, detailOpen]);

  // La store vive solo en memoria: al montar (crear/recargar) se consulta la
  // lista real del backend y se reemplaza el contenido de la store.
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        // Los filtros de la vista operan solo sobre los pedidos del día actual.
        const { dateFrom, dateTo } = localDayUtcRange();
        const [ordersResp, products] = await Promise.all([
          orderService.list({ limit: 100, dateFrom, dateTo }),
          productService.listAll(),
        ]);
        if (!active) return;

        if (ordersResp.code === 200) {
          const nameByProduct = new Map(
            products.map((product) => [product.id, product.name]),
          );
          setOrders(
            ordersResp.data.items.map((order) =>
              mapApiOrder(order, nameByProduct),
            ),
          );
        } else {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar pedidos',
            description: ordersResp.msg || 'No se pudieron cargar los pedidos.',
          });
        }
      } catch {
        if (active) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar pedidos',
            description: 'No se pudo conectar con el servidor.',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [setOrders]);

  // Conteo por tag para mostrar la cantidad en cada filtro
  const counts = useMemo(() => {
    const result: Record<TypeFilter, number> = { todas: orders.length, mesa: 0, 'para-llevar': 0, domicilio: 0 };
    orders.forEach((order) => {
      result[order.type] += 1;
    });
    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    // Se busca con o sin el numeral (#20261025-0007 o 20261025-0007)
    const query = search.trim().toLowerCase().replace(/^#/, '');
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

  // Cancelar un pedido: PUT /orders/:id { status: 'cancelled' } (matriz de
  // transiciones del backend) y actualización optimista de la store.
  const handleCancelOrder = async (order: Order) => {
    if (cancellingId) return;
    if (
      !window.confirm(
        `¿Seguro que quieres cancelar el pedido ${order.orderNumber}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setCancellingId(order.id);
    try {
      const resp = await orderService.update(Number(order.id), {
        status: 'cancelled',
      });
      if (resp.code === 200) {
        updateOrderStatus(order.id, 'cancelled');
        toast({
          variant: 'success',
          title: '✅ Pedido cancelado',
          description: `El pedido ${order.orderNumber} quedó cancelado.`,
        });
      } else {
        toast({
          variant: 'warning',
          title: '❌ No se pudo cancelar',
          description: apiErrorMessage(resp, 'Intenta de nuevo.'),
        });
      }
    } catch {
      toast({
        variant: 'warning',
        title: '❌ No se pudo cancelar',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Clic en una tarjeta: en escritorio selecciona (el panel fijo ya se ve);
  // en móvil/tablet además abre el drawer con el detalle cargado.
  const handleSelectOrder = (order: Order) => {
    setSelectedId(order.id);
    if (!isDesktop) setDetailOpen(true);
  };

  /** Cierra el detalle (✕ del panel o del drawer) y limpia la selección. */
  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetailOpen(false);
  };

  // El MISMO detalle se usa en el panel fijo de escritorio y en el drawer
  // móvil: todo su estado lo maneja esta página.
  const detailPanel = selectedOrder ? (
    <OrderDetailPanel
      order={selectedOrder}
      onClose={handleCloseDetail}
      onEdit={
        !isFinalOrder(selectedOrder)
          ? () => navigate(`/pedidos/${selectedOrder.id}/editar`)
          : undefined
      }
      onCancel={
        !isFinalOrder(selectedOrder)
          ? () => handleCancelOrder(selectedOrder)
          : undefined
      }
      cancelling={cancellingId === selectedOrder.id}
    />
  ) : null;

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
          wide
          main={
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start justify-between gap-3 sm:justify-start">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Selecciona un pedido para ver su detalle
                    </p>
                  </div>
                  {/* Móvil/tablet: el panel derecho (con "Crear pedido") está
                      oculto en lg-, así que el alta se ofrece aquí. */}
                  <Button
                    size="sm"
                    className="h-9 shrink-0 gap-1.5 lg:hidden"
                    onClick={() => navigate('/pedidos/nuevo')}
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo pedido
                  </Button>
                </div>
                <div className="w-full sm:w-72 flex-shrink-0">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar pedido o cliente..."
                  />
                </div>
              </div>

              {/* Filtro por tags de tipo de orden (estilo único de filtros) */}
              <FilterTabs
                label="Filtrar por tipo de pedido"
                items={TYPE_TAGS.map((tag) => ({
                  id: tag.id,
                  label: tag.label,
                  count: counts[tag.id],
                }))}
                active={typeFilter}
                onChange={(id) => setTypeFilter(id as TypeFilter)}
              />

              {/* Tarjetas de pedidos */}
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
                  <span className="text-4xl">🧾</span>
                  <p className="mt-4 font-medium">
                    {loading
                      ? 'Cargando pedidos…'
                      : orders.length === 0
                        ? 'Aún no hay pedidos'
                        : 'No hay pedidos con este filtro'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {loading
                      ? 'Consultando el servidor…'
                      : orders.length === 0
                        ? 'Crea tu primer pedido con el botón "Crear pedido".'
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
                      onSelect={() => handleSelectOrder(order)}
                    />
                  ))}
                </div>
              )}
            </div>
          }
          sidebar={
            isDesktop ? (
              <div className="flex h-full min-h-0 flex-col">
                {/* Botón para abrir la pantalla de creación */}
                <div className="shrink-0 border-b p-4">
                  <Button className="w-full gap-2" size="lg" onClick={() => navigate('/pedidos/nuevo')}>
                    <Plus className="h-4 w-4" />
                    Crear pedido
                  </Button>
                </div>

                {/* Detalle del pedido seleccionado */}
                {selectedOrder ? (
                  <div className="min-h-0 flex-1">{detailPanel}</div>
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
            ) : null
          }
        />

        {/* Drawer con el detalle del pedido (solo < lg): se abre al tocar
            una tarjeta. La cabecera es solo ícono + ✕ porque el título
            "Detalle del pedido" lo trae el propio panel. */}
        <SideDrawer
          open={detailOpen}
          onOpenChange={setDetailOpen}
          title="Detalle del pedido"
          showTitle={false}
          icon={<ClipboardList className="h-4 w-4 text-primary" />}
        >
          {!isDesktop && detailPanel}
        </SideDrawer>
      </div>
    </div>
  );
}

