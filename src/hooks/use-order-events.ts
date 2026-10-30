import { useEffect, useRef } from 'react';
import { connectOrderEvents, type OrderEventHandlers } from '@/services';
import { useAuthStore } from '@/store';

/**
 * Suscripción en tiempo real a los eventos de pedidos de la sede:
 * `order:created`, `order:updated` y `order:deleted` (Socket.IO).
 *
 * Se conecta cuando hay sesión y se reconecta si cambia el token; al
 * desmontar, cierra el socket. Los handlers se leen por ref para no
 * reconectar en cada render.
 */
export function useOrderEvents(handlers: OrderEventHandlers): void {
  const accessToken = useAuthStore((state) => state.accessToken);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectOrderEvents(accessToken, {
      onOrderCreated: (order) => handlersRef.current.onOrderCreated?.(order),
      onOrderUpdated: (order) => handlersRef.current.onOrderUpdated?.(order),
      onOrderDeleted: (info) => handlersRef.current.onOrderDeleted?.(info),
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);
}
