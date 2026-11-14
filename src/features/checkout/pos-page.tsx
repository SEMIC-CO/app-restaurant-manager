import { useCallback, useEffect, useMemo, useState } from "react";
import { POSLayout } from "@/app/layout";
import { ConfigSidebar, AppHeader } from "@/components/common";
import {
  CashierFilters,
  ChargeDialog,
  OrderCard,
  OrderTicket,
  TablesGrid,
  type CashierView,
} from "@/components/pos";
import { toast, useFloorTables, useOrderEvents } from "@/hooks";
import { orderService, productService } from "@/services";
import { useCartStore } from "@/store";
import { formatOrderNumber, mapApiOrder } from "@/utils";
import type { FloorTable, Order } from "@/types";

/**
 * Estados que la Caja lista para cobrar: los activos (pendiente, en
 * preparación y listo) y los **entregados** todavía sin pagar. El pedido
 * entregado es justamente el que falta cobrar: la matriz del backend lo
 * lleva de `delivered` a `paid` al facturarlo.
 */
const CHARGEABLE_ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "delivered",
] as const;

function apiErrorMessage(resp: { code: number; msg: string; data: unknown }, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(", ");
  return resp.msg || fallback;
}

/**
 * Caja (/caja): dos filtros en el área principal — **Pedidos** (los que
 * faltan por cobrar: pendientes, en preparación, listos y entregados) y
 * **Mesas** (las ocupadas). Al hacer clic en una mesa o en un pedido, sus
 * datos (ítems, cliente y mesa) se cargan en el ticket de la caja con su
 * total real.
 */
export function POSPage() {
  /** Arranca siempre en el filtro "Pedidos". */
  const [view, setView] = useState<CashierView>("pedidos");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  /** Formulario de cobro (Cobrar → datos del cliente, efectivo y factura). */
  const [chargeOpen, setChargeOpen] = useState(false);

  // Sin polling: la Caja se refresca con el socket (abajo), que recarga
  // tanto los pedidos como la ocupación de las mesas.
  const { tables, loading: tablesLoading, refresh } = useFloorTables({
    poll: false,
  });
  const loadOrder = useCartStore((state) => state.loadOrder);
  const clearCart = useCartStore((state) => state.clearCart);
  const loadedOrder = useCartStore((state) => state.loadedOrder);

  const load = useCallback(async () => {
    try {
      const [ordersResps, products] = await Promise.all([
        Promise.all(
          CHARGEABLE_ORDER_STATUSES.map((status) =>
            orderService.list({ limit: 100, status }),
          ),
        ),
        productService.listAll(),
      ]);

      const failed = ordersResps.find((resp) => resp.code !== 200);
      if (failed) {
        toast({
          variant: "warning",
          title: "❌ Error al cargar pedidos",
          description: apiErrorMessage(failed, "No se pudieron cargar los pedidos."),
        });
        return;
      }

      const nameByProduct = new Map(
        products.map((product) => [product.id, product.name]),
      );
      setOrders(
        ordersResps
          .flatMap((resp) => resp.data.items)
          .map((order) => mapApiOrder(order, nameByProduct))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      );
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al cargar pedidos",
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Carga inicial; el refresco posterior lo dispara el socket de abajo.
  useEffect(() => {
    void load();
  }, [load]);

  /**
   * El socket avisa de cada alta, cambio o borrado de pedido: con eso basta
   * para que los pedidos, los productos del ticket y la ocupación de las
   * mesas queden al día. La Caja ya no hace polling.
   */
  const handleOrderEvent = useCallback(() => {
    void load();
    void refresh();
  }, [load, refresh]);

  // Tiempo real (Socket.IO): el ticket y las mesas se actualizan al instante.
  useOrderEvents({
    onOrderCreated: handleOrderEvent,
    onOrderUpdated: handleOrderEvent,
    onOrderDeleted: handleOrderEvent,
  });

  const occupiedTables = useMemo(
    () => tables.filter((table) => table.floorStatus === "occupied"),
    [tables],
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  /** Carga (o reemplaza) el ticket de la caja con los datos del pedido. */
  const handleLoadOrder = (order: Order, table: FloorTable | null) => {
    loadOrder({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        discount: Math.max(0, order.subtotal - order.total),
      },
      items: order.items,
      customerName: order.customerName ?? "",
      table,
    });
    setSelectedId(order.id);
    setSelectedTable(table);
  };

  /** Clic en un pedido de la lista: busca su mesa (si es de tipo mesa). */
  const handleSelectOrder = (order: Order) => {
    const table =
      order.type === "mesa"
        ? tables.find((item) => item.orderNumber === order.orderNumber) ??
          tables.find((item) => item.name === (order.tableNumber ?? ""))
        : undefined;
    handleLoadOrder(order, table ?? null);
  };

  /** Clic en una mesa ocupada: carga el pedido activo que la tiene asignada. */
  const handleSelectTable = (table: FloorTable) => {
    const order =
      orders.find((item) => item.orderNumber === table.orderNumber) ??
      orders.find(
        (item) => item.type === "mesa" && item.tableNumber === table.name,
      );

    if (!order) {
      toast({
        variant: "warning",
        title: "❌ Mesa sin pedido",
        description: `No se encontró un pedido activo para ${table.name}.`,
      });
      return;
    }
    handleLoadOrder(order, table);
  };

  const handleClearTicket = () => {
    clearCart();
    setSelectedId(null);
    setSelectedTable(null);
  };

  /**
   * Facturación completada: se limpia el ticket y se refrescan las mesas
   * al instante para ver la mesa liberada (además del socket).
   */
  const handleFacturado = () => {
    handleClearTicket();
    void refresh();
  };

  const handleCharge = () => setChargeOpen(true);
  const handleSave = () => console.log("Saving order...");

  const filters = useMemo(
    () => [
      { id: "pedidos" as const, label: "Pedidos", count: orders.length },
      { id: "mesas" as const, label: "Mesas", count: occupiedTables.length },
    ],
    [orders.length, occupiedTables.length],
  );

  const main =
    view === "mesas" ? (
      tablesLoading && tables.length === 0 ? (
        <TablesGrid tables={[]} loading />
      ) : occupiedTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
          <span className="text-4xl">🪑</span>
          <p className="mt-4 font-medium">No hay mesas ocupadas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Todas las mesas están libres en este momento.
          </p>
        </div>
      ) : (
        <TablesGrid
          tables={occupiedTables}
          onSelectTable={handleSelectTable}
          selectedId={selectedTable?.id ?? null}
        />
      )
    ) : ordersLoading && orders.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
        <span className="text-4xl">⏳</span>
        <p className="mt-4 font-medium">Cargando pedidos…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultando los pedidos de la sede
        </p>
      </div>
    ) : orders.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
        <span className="text-4xl">🧾</span>
        <p className="mt-4 font-medium">No hay pedidos por cobrar</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aparecerán aquí los pedidos pendientes, en preparación, listos o
          entregados.
        </p>
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            selected={order.id === selectedId}
            onSelect={() => handleSelectOrder(order)}
          />
        ))}
      </div>
    );

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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Caja</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {view === "mesas"
                      ? "Haz click en una mesa ocupada para cargar su pedido en el ticket"
                      : "Haz click en un pedido para cargarlo en el ticket"}
                  </p>
                </div>
                <CashierFilters
                  filters={filters}
                  activeView={view}
                  onViewChange={setView}
                />
              </div>

              {main}
            </div>
          }
          sidebar={
            <OrderTicket
              orderNumber={
                selectedOrder
                  ? formatOrderNumber(selectedOrder.orderNumber)
                  : "Ticket nuevo"
              }
              table={selectedTable}
              onClearTicket={loadedOrder ? handleClearTicket : undefined}
              onCharge={handleCharge}
              onSave={handleSave}
            />
          }
        />

        {/* Cobro: formulario con datos del cliente, efectivo y acciones de factura */}
        <ChargeDialog
          open={chargeOpen}
          onOpenChange={setChargeOpen}
          orderNumber={
            selectedOrder ? formatOrderNumber(selectedOrder.orderNumber) : undefined
          }
          orderId={selectedOrder ? Number(selectedOrder.id) : undefined}
          orderStatus={selectedOrder?.status}
          onSaved={handleFacturado}
        />
      </div>
    </div>
  );
}
