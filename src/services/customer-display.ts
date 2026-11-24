import type { PaymentMethod } from '@/types';

/** Fases de la segunda pantalla de Caja. */
export type CustomerDisplayPhase = 'idle' | 'charging' | 'paid';

export interface CustomerDisplayItem {
  name: string;
  quantity: number;
  subtotal: number;
}

/** Estado que Caja publica y la vista cliente pinta. */
export interface CustomerDisplaySnapshot {
  phase: CustomerDisplayPhase;
  orderNumber: string | null;
  table: string | null;
  customerName: string | null;
  items: CustomerDisplayItem[];
  subtotal: number;
  discount: number;
  tip: number;
  /** Total a cobrar (ya incluye la propina). */
  total: number;
  paymentMethod: PaymentMethod | null;
}

export type CustomerDisplayMessage =
  | { type: 'snapshot'; payload: CustomerDisplaySnapshot }
  | { type: 'ready' };

/** Canal por sede: dos cajas distintas no se pisan entre sí. */
export function customerDisplayChannelName(headquarterId: number | null): string {
  return `caja-vista-cliente-${headquarterId ?? 0}`;
}

function openChannel(headquarterId: number | null): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(customerDisplayChannelName(headquarterId));
}

export function publishCustomerDisplay(
  headquarterId: number | null,
  snapshot: CustomerDisplaySnapshot,
): void {
  const channel = openChannel(headquarterId);
  if (!channel) return;
  const message: CustomerDisplayMessage = { type: 'snapshot', payload: snapshot };
  channel.postMessage(message);
  channel.close();
}

export function subscribeCustomerDisplay(
  headquarterId: number | null,
  handler: (message: CustomerDisplayMessage) => void,
): () => void {
  const channel = openChannel(headquarterId);
  if (!channel) return () => {};
  channel.onmessage = (event: MessageEvent<CustomerDisplayMessage>) => {
    handler(event.data);
  };
  return () => channel.close();
}

/** La vista cliente avisa al abrirse para recibir el estado actual. */
export function announceCustomerDisplayReady(headquarterId: number | null): void {
  const channel = openChannel(headquarterId);
  if (!channel) return;
  const message: CustomerDisplayMessage = { type: 'ready' };
  channel.postMessage(message);
  channel.close();
}

/** Abre (o enfoca) la segunda pantalla. `false` si el navegador bloqueó el popup. */
export function openCustomerDisplay(): boolean {
  const win = window.open('/caja/vista-cliente', 'vista-cliente');
  if (!win) return false;
  win.focus();
  return true;
}
