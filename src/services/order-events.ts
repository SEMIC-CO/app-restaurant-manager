import { io, type Socket } from 'socket.io-client';
import type { ApiOrder } from '@/types';

/** Socket.IO vive en el mismo servidor que la API (sin `/api/v1`). */
const SOCKET_ORIGIN = new URL(import.meta.env.VITE_URL_API).origin;

export interface OrderEventHandlers {
  onOrderCreated?: (order: ApiOrder) => void;
  onOrderUpdated?: (order: ApiOrder) => void;
  onOrderDeleted?: (info: { id: number }) => void;
}

/**
 * Conecta a los eventos de pedidos del backend (Socket.IO) usando el access
 * token del usuario. El servidor solo emite eventos de la **sede** del token
 * (las conexiones sin token válido se desconectan).
 */
export function connectOrderEvents(
  accessToken: string,
  handlers: OrderEventHandlers,
): Socket {
  const socket = io(SOCKET_ORIGIN, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  socket.on('order:created', (order: ApiOrder) => {
    handlers.onOrderCreated?.(order);
  });
  socket.on('order:updated', (order: ApiOrder) => {
    handlers.onOrderUpdated?.(order);
  });
  socket.on('order:deleted', (info: { id: number }) => {
    handlers.onOrderDeleted?.(info);
  });

  return socket;
}
