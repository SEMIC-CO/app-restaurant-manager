import { create } from 'zustand';
import type { FloorTable, OrderItem, PaymentMethod } from '@/types';

/**
 * Pedido existente cargado en el ticket de la caja (filtro Pedidos/Mesas).
 * Mientras esté presente, los totales del ticket salen del pedido real
 * (subtotal − descuento), no del cálculo con IVA de un ticket nuevo.
 */
export interface LoadedOrder {
  id: string;
  orderNumber: string;
  /** `orders.discount` del backend (derivado: subtotal − total). */
  discount: number;
}

interface CartState {
  items: OrderItem[];
  customerName: string;
  table: FloorTable | null;
  paymentMethod: PaymentMethod;
  /** Pedido cargado en el ticket; `null` cuando es un ticket nuevo. */
  loadedOrder: LoadedOrder | null;
  /**
   * Propina voluntaria del ticket como fracción (0 = sin propina, 0.05, 0.10).
   * No se persiste: cada ticket/pedido arranca sin propina.
   */
  tipRate: number;
  /** Importe (en efectivo) que entrega el cliente; vacío = sin informar. */
  amountReceived: string;

  // Actions
  addItem: (item: Omit<OrderItem, 'id' | 'subtotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setTable: (table: FloorTable | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTipRate: (rate: number) => void;
  /** Efectivo recibido en la caja (texto para poder borrar el campo). */
  setAmountReceived: (value: string) => void;
  /** Reemplaza el ticket con los datos (ítems, cliente, mesa) de un pedido. */
  loadOrder: (payload: {
    order: LoadedOrder;
    items: OrderItem[];
    customerName?: string;
    table?: FloorTable | null;
  }) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTip: () => number;
  /** Total **a facturar**: sin propina (la propina voluntaria no se factura). */
  getTotal: () => number;
  /** Total **a cobrar** en caja: total + propina voluntaria. */
  getPayable: () => number;
}

const TAX_RATE = 0.10; // 10%

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  table: null,
  paymentMethod: 'cash',
  loadedOrder: null,
  tipRate: 0,
  amountReceived: '',

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find(i => i.productId === item.productId);

      if (existingItem) {
        return {
          items: state.items.map(i =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  subtotal: (i.quantity + item.quantity) * i.unitPrice
                }
              : i
          ),
        };
      }

      const newItem: OrderItem = {
        ...item,
        id: crypto.randomUUID(),
        subtotal: item.quantity * item.unitPrice,
      };

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(i => i.id !== itemId),
    }));
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state) => ({
      items: state.items.map(i =>
        i.id === itemId
          ? { ...i, quantity, subtotal: quantity * i.unitPrice }
          : i
      ),
    }));
  },

  setCustomerName: (customerName) => set({ customerName }),
  setTable: (table) => set({ table }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setTipRate: (tipRate) => set({ tipRate }),
  setAmountReceived: (amountReceived) => set({ amountReceived }),

  loadOrder: ({ order, items, customerName = '', table = null }) =>
    set({
      items: items.map((item) => ({ ...item })),
      customerName,
      table,
      loadedOrder: order,
      tipRate: 0,
      amountReceived: '',
    }),

  clearCart: () => set({
    items: [],
    customerName: '',
    table: null,
    loadedOrder: null,
    tipRate: 0,
    amountReceived: '',
  }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.subtotal, 0);
  },

  getTax: () => {
    return get().getSubtotal() * TAX_RATE;
  },

  getDiscount: () => {
    return get().loadedOrder?.discount ?? 0;
  },

  /** Propina: % elegido sobre el subtotal (0 si es voluntaria y no se eligió). */
  getTip: () => {
    return get().getSubtotal() * get().tipRate;
  },

  getTotal: () => {
    // Pedido cargado: el backend ya calcula su total (sin el IVA del ticket nuevo)
    const { loadedOrder } = get();
    if (loadedOrder) return get().getSubtotal() - loadedOrder.discount;
    return get().getSubtotal() + get().getTax();
  },

  getPayable: () => {
    return get().getTotal() + get().getTip();
  },
}));

