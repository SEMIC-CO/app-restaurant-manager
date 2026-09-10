import { create } from 'zustand';
import type { OrderItem, PaymentMethod, Table } from '@/types';

interface CartState {
  items: OrderItem[];
  customerName: string;
  tableNumber: number | null;
  table: Table | null;
  paymentMethod: PaymentMethod;

  // Actions
  addItem: (item: Omit<OrderItem, 'id' | 'subtotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setTableNumber: (table: number | null) => void;
  setTable: (table: Table | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

const TAX_RATE = 0.10; // 10%

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  tableNumber: null,
  table: null,
  paymentMethod: 'cash',

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
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setTable: (table) => set({ table, tableNumber: table ? table.number : null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  clearCart: () => set({
    items: [],
    customerName: '',
    tableNumber: null,
    table: null,
  }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.subtotal, 0);
  },

  getTax: () => {
    return get().getSubtotal() * TAX_RATE;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },
}));

