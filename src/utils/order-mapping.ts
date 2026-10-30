import type { ApiOrder, Order, OrderType } from '@/types';

/** Etiqueta del backend (`orders.order_type`) → valor del front. */
const TYPE_BY_LABEL: Record<string, OrderType> = {
  Mesa: 'mesa',
  'Para Llevar': 'para-llevar',
  Domicilio: 'domicilio',
};

/**
 * Tipo de la orden según la respuesta del API (`orderType`). Para órdenes
 * antiguas (creadas cuando el tipo solo vivía en `notes`) se lee ese texto y,
 * si tampoco está, se asume 'mesa' (el default de la columna).
 */
export function orderTypeFromApi(api: ApiOrder): OrderType {
  if (api.orderType && TYPE_BY_LABEL[api.orderType]) {
    return TYPE_BY_LABEL[api.orderType];
  }
  const legacy = api.notes?.match(/Tipo de orden:\s*(Mesa|Para Llevar|Domicilio)/);
  if (legacy) return TYPE_BY_LABEL[legacy[1]];
  return 'mesa';
}

/**
 * Etiqueta legible de la mesa de un pedido: el backend guarda el **nombre**
 * ("Mesa 2") o valores heredados numéricos ("5") → nunca se convierte a
 * número (eso producía `NaN`).
 */
export function formatTableLabel(tableNumber?: string | null): string {
  if (!tableNumber) return 'Sin mesa';
  return /^mesa\s/i.test(tableNumber) ? tableNumber : `Mesa ${tableNumber}`;
}

/**
 * Convierte la orden del backend al modelo del store/`Order`, resolviendo los
 * nombres de producto con el mapa recibido (la API solo trae `productId`).
 */
export function mapApiOrder(
  api: ApiOrder,
  nameByProduct: Map<number, string>,
): Order {
  return {
    id: String(api.id),
    orderNumber: api.orderNumber,
    customerName: api.customerName ?? undefined,
    notes: api.notes ?? undefined,
    tableNumber: api.tableNumber || undefined,
    status: api.status,
    subtotal: Number(api.subtotal),
    tax: 0,
    total: Number(api.total),
    type: orderTypeFromApi(api),
    items: api.items.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      productId: String(item.productId),
      productName:
        nameByProduct.get(item.productId) ?? `Producto #${item.productId}`,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    createdAt: new Date(api.orderDatetime),
    updatedAt: new Date(),
  };
}
