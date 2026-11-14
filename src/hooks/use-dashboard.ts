import { useCallback, useEffect, useRef, useState } from 'react';
import { reportService } from '@/services';
import { toISODate } from '@/utils';
import type { ApiResponse, DashboardReport } from '@/types';
import { useOrderEvents } from './use-order-events';
import { toast } from './use-toast';

/** Espera entre un evento de pedido y el refresco, para no martillar la API. */
const REFRESH_DEBOUNCE_MS = 1000;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

interface UseDashboardResult {
  report: DashboardReport | null;
  /** Primera carga: todavía no hay nada que pintar. */
  loading: boolean;
  /** Refresco en curso con datos ya en pantalla. */
  refreshing: boolean;
  error: string | null;
  /** Recarga el dashboard del día (botón "Actualizar"). */
  refresh: () => Promise<void>;
}

/**
 * Carga el dashboard del día (`GET /reports/dashboard`) al montar y lo
 * refresca cuando el socket de la sede avisa de un pedido creado, cambiado
 * o eliminado: así los KPIs, el salón y los últimos movimientos quedan en
 * vivo sin polling.
 *
 * Varios eventos seguidos comparten un solo refresco (debounce) y los
 * errores se notifican una sola vez, para no inundar la pantalla de toasts.
 */
export function useDashboard(): UseDashboardResult {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadedRef = useRef(false);
  const notifiedErrorRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    // Antes de la primera carga el estado es `loading`, no `refreshing`.
    setRefreshing(loadedRef.current);

    try {
      const resp = await reportService.getDashboard(toISODate());
      if (resp.code === 200 && resp.data) {
        setReport(resp.data);
        setError(null);
        notifiedErrorRef.current = false;
      } else {
        const message = apiErrorMessage(
          resp,
          'No se pudieron cargar los datos del dashboard.',
        );
        setError(message);
        if (!notifiedErrorRef.current) {
          notifiedErrorRef.current = true;
          toast({
            variant: 'warning',
            title: '❌ Error al cargar el dashboard',
            description: message,
          });
        }
      }
    } catch {
      const message = 'No se pudo conectar con el servidor.';
      setError(message);
      if (!notifiedErrorRef.current) {
        notifiedErrorRef.current = true;
        toast({
          variant: 'warning',
          title: '❌ Error al cargar el dashboard',
          description: message,
        });
      }
    } finally {
      loadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial.
  useEffect(() => {
    void load();
  }, [load]);

  // Un solo refresco aunque lleguen varios eventos del socket juntos.
  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void load();
    }, REFRESH_DEBOUNCE_MS);
  }, [load]);

  useOrderEvents({
    onOrderCreated: scheduleRefresh,
    onOrderUpdated: scheduleRefresh,
    onOrderDeleted: scheduleRefresh,
  });

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return { report, loading, refreshing, error, refresh: load };
}
