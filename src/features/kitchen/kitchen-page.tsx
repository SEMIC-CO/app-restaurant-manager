import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KitchenSidebar,
  TicketCard,
  TicketFilters,
} from "@/components/kitchen";
import type { Order } from "@/types";
import { ConfigSidebar, AppHeader } from "@/components/common";
import { toast, useOrderEvents } from "@/hooks";
import { orderService, productService } from "@/services";
import { mapApiOrder, toISODate } from "@/utils";

function apiErrorMessage(resp: { code: number; msg: string; data: unknown }, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(", ");
  return resp.msg || fallback;
}

/**
 * Cocina: cola de tickets con los pedidos **reales** de la sede
 * (pendientes + en preparación), filtros por tipo con conteos reales,
 * unidades a preparar y desglose por producto. "Marcar Listo" avanza el
 * estado en el backend (pending → preparing → ready).
 *
 * El filtro **"Listos / Entregados"** muestra el histórico de tickets que
 * ya terminaron su paso por cocina (`ready` + `delivered`), con su propio
 * conteo; los datos se refrescan al instante con Socket.IO.
 */
export function KitchenPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  /** Tickets finalizados en cocina (listos, entregados o facturados). */
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Cola e histórico solo del día actual (filtros dateFrom/dateTo).
      const today = toISODate();
      const [
        pendingResp,
        preparingResp,
        readyResp,
        deliveredResp,
        paidResp,
        products,
      ] = await Promise.all([
        orderService.list({ limit: 100, status: "pending", dateFrom: today, dateTo: today }),
        orderService.list({ limit: 100, status: "preparing", dateFrom: today, dateTo: today }),
        orderService.list({ limit: 100, status: "ready", dateFrom: today, dateTo: today }),
        orderService.list({ limit: 100, status: "delivered", dateFrom: today, dateTo: today }),
        orderService.list({ limit: 100, status: "paid", dateFrom: today, dateTo: today }),
        productService.listAll(),
      ]);

      const failed = [
        pendingResp,
        preparingResp,
        readyResp,
        deliveredResp,
        paidResp,
      ].find((resp) => resp.code !== 200);
      if (failed) {
        toast({
          variant: "warning",
          title: "❌ Error al cargar la cola",
          description: apiErrorMessage(failed, "No se pudieron cargar los pedidos."),
        });
        return;
      }

      const nameByProduct = new Map(
        products.map((product) => [product.id, product.name]),
      );
      // La cocina atiende por orden de llegada: más antiguos primero
      setOrders(
        [...pendingResp.data.items, ...preparingResp.data.items]
          .map((order) => mapApiOrder(order, nameByProduct))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      );
      // Histórico de finalizados (listos, entregados y facturados): los más
      // recientes arriba
      setCompletedOrders(
        [
          ...readyResp.data.items,
          ...deliveredResp.data.items,
          ...paidResp.data.items,
        ]
          .map((order) => mapApiOrder(order, nameByProduct))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      );
    } catch {
      toast({
        variant: "warning",
        title: "❌ Error al cargar la cola",
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial; el refresco posterior lo dispara el socket de abajo.
  useEffect(() => {
    void load();
  }, [load]);

  // Tiempo real (Socket.IO): cada alta, cambio o borrado de pedido recarga la
  // cola al instante, sin que nadie tenga que refrescar la pantalla.
  useOrderEvents({
    onOrderCreated: () => void load(),
    onOrderUpdated: () => void load(),
    onOrderDeleted: () => void load(),
  });

  const filteredOrders = useMemo(() => {
    // "completados" → histórico de tickets listos o entregados (todos los tipos)
    if (activeFilter === "completados") return completedOrders;
    return activeFilter === "all"
      ? orders
      : orders.filter((order) => order.type === activeFilter);
  }, [orders, completedOrders, activeFilter]);

  // Conteos reales por tipo (pestañas de filtro)
  const counts = useMemo(() => {
    const result: Record<string, number> = {
      all: orders.length,
      "para-llevar": 0,
      mesa: 0,
      domicilio: 0,
      completados: completedOrders.length,
    };
    orders.forEach((order) => {
      result[order.type] += 1;
    });
    return result;
  }, [orders, completedOrders]);

  const ticketFilters = useMemo(
    () => [
      { type: "all" as const, label: "Todos", count: counts.all },
      { type: "para-llevar" as const, label: "Para Llevar", count: counts["para-llevar"] },
      { type: "mesa" as const, label: "Mesa", count: counts.mesa },
      { type: "domicilio" as const, label: "Domicilio", count: counts.domicilio },
      {
        type: "completados" as const,
        label: "Listos / Entregados",
        count: counts.completados,
      },
    ],
    [counts],
  );

  // Unidades a preparar (suma de cantidades de la cola)
  const totalUnits = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum + order.items.reduce((inner, item) => inner + item.quantity, 0),
        0,
      ),
    [orders],
  );

  // Desglose real por producto (top6) para el panel lateral
  const flavorCounts = useMemo(() => {
    const byProduct = new Map<string, number>();
    orders.forEach((order) =>
      order.items.forEach((item) =>
        byProduct.set(
          item.productName,
          (byProduct.get(item.productName) ?? 0) + item.quantity,
        ),
      ),
    );
    return [...byProduct.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [orders]);

  /**
   * "Marcar Listo": la matriz de estados no permite saltar pending → ready,
   * así que un pedido pendiente pasa primero por preparing.
   */
  const handleMarkReady = async (orderId: string) => {
    if (updatingId) return;
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;

    setUpdatingId(orderId);
    try {
      if (order.status === "pending") {
        const preparing = await orderService.update(Number(orderId), {
          status: "preparing",
        });
        if (preparing.code !== 200) {
          toast({
            variant: "warning",
            title: "❌ No se pudo iniciar la preparación",
            description: apiErrorMessage(preparing, "Intenta de nuevo."),
          });
          return;
        }
      }

      const ready = await orderService.update(Number(orderId), {
        status: "ready",
      });
      if (ready.code === 200) {
        setOrders((prev) => prev.filter((item) => item.id !== orderId));
        toast({
          variant: "success",
          title: "✅ Ticket listo",
          description: `El pedido ${order.orderNumber} está listo para entregar.`,
        });
      } else {
        toast({
          variant: "warning",
          title: "❌ No se pudo marcar el ticket",
          description: apiErrorMessage(ready, "Intenta de nuevo."),
        });
      }
    } catch {
      toast({
        variant: "warning",
        title: "❌ No se pudo marcar el ticket",
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setUpdatingId(null);
      void load();
    }
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
          {/* 2a) Kitchen sidebar - unidades a preparar + top productos (lg+) */}
          <aside className="hidden w-[200px] flex-shrink-0 bg-primary text-primary-foreground lg:block h-full overflow-y-auto">
            <KitchenSidebar totalPending={totalUnits} flavorCounts={flavorCounts} />
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

              {loading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl">⏳</span>
                  <p className="mt-4 text-lg font-medium">Cargando tickets…</p>
                  <p className="text-muted-foreground">
                    Consultando los pedidos de la sede
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-4xl">
                    {activeFilter === "completados" ? "🕓" : "✅"}
                  </span>
                  <p className="mt-4 text-lg font-medium">
                    {activeFilter === "completados" ? "Sin tickets finalizados" : "¡Todo al día!"}
                  </p>
                  <p className="text-muted-foreground">
                    {activeFilter === "completados"
                      ? "Todavía no hay pedidos listos ni entregados"
                      : orders.length === 0
                        ? "No hay pedidos pendientes en la cocina"
                        : "No hay pedidos con este filtro"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <TicketCard
                      key={order.id}
                      order={order}
                      onMarkReady={handleMarkReady}
                      updating={updatingId === order.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
