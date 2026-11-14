import { useCallback, useEffect, useState } from 'react';
import { orderService, sectionService, tableService } from '@/services';
import { toast } from './use-toast';
import type { ApiOrder, FloorTable, Section } from '@/types';

/**
 * Estados de orden que mantienen la mesa ocupada: los activos (pendiente,
 * en preparación y listo) y los **entregados** todavía sin pagar. La mesa
 * se libera cuando la caja factura el pedido (`paid`).
 */
const ACTIVE_ORDER_STATUSES = ['pending', 'preparing', 'ready', 'delivered'] as const;

/**
 * Refresco periódico del estado de ocupación (libre/ocupada). Solo aplica
 * cuando el componente no tiene otra fuente de eventos: la Caja se entera
 * por el socket y apaga este polling.
 */
const POLL_INTERVAL_MS = 30000;

interface UseFloorTablesOptions {
  /**
   * Refrescar cada 30 s (por defecto `true`). Pásalo como `false` cuando el
   * caller se entere por Socket.IO y llame a `refresh()` a mano, para no
   * duplicar peticiones.
   */
  poll?: boolean;
}

interface FloorTablesResult {
  /** Mesas ACTIVAS de la sede con su estado de ocupación derivado de las órdenes. */
  tables: FloorTable[];
  /** Secciones reales de la sede (para tabs y agrupaciones). */
  sections: Section[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Mesas del piso + secciones reales (API /tables y /sections).
 *
 * El estado ocupada/libre NO viene del backend: se deriva cruzando las mesas
 * con las órdenes que aún no se pagan (pending/preparing/ready/delivered)
 * por `idTable`. Solo se listan mesas `ACTIVO`; las desactivadas no aparecen.
 */
export function useFloorTables({
  poll = true,
}: UseFloorTablesOptions = {}): FloorTablesResult {
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [tablesResp, sectionsResp, ...ordersResp] = await Promise.all([
        tableService.list({ limit: 100, status: 'ACTIVO' }),
        sectionService.list({ limit: 100 }),
        ...ACTIVE_ORDER_STATUSES.map((status) =>
          orderService.list({ limit: 100, status }),
        ),
      ]);

      if (tablesResp.code !== 200 || sectionsResp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar mesas',
          description: tablesResp.msg || sectionsResp.msg || 'No se pudieron cargar las mesas.',
        });
        return;
      }

      const sectionMap = new Map(sectionsResp.data.items.map((s) => [s.id, s]));
      const activeOrders = ordersResp.flatMap((r) => (r.code === 200 ? r.data.items : []));
      const orderByTable = new Map<number, ApiOrder>();
      for (const order of activeOrders) {
        if (order.idTable !== null && !orderByTable.has(order.idTable)) {
          orderByTable.set(order.idTable, order);
        }
      }

      setTables(
        tablesResp.data.items.map((table) => {
          const order = orderByTable.get(table.id);
          return {
            id: table.id,
            name: table.name,
            cantPeople: table.cantPeople,
            sectionId: table.sectionId,
            sectionName: sectionMap.get(table.sectionId)?.name ?? '—',
            status: table.status,
            floorStatus: order ? ('occupied' as const) : ('available' as const),
            orderNumber: order?.orderNumber,
            customerName: order?.customerName ?? undefined,
          };
        }),
      );
      setSections(sectionsResp.data.items);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar mesas',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Sin polling: quien llame con `poll: false` se entera por el socket y
    // refresca con `refresh()`.
    if (!poll) return;
    const interval = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, poll]);

  return { tables, sections, loading, refresh: load };
}
