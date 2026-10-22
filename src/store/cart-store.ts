import { create } from 'zustand';
import type { FloorTable, OrderItem, PaymentMethod } from '@/types';

interface CartState {
  items: OrderItem[];
  customerName: string;
  table: FloorTable | null;
  paymentMethod: PaymentMethod;

  // Actions
  addItem: (item: Omit<OrderItem, 'id' | 'subtotal'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  setTable: (table: FloorTable | null) => void;
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
  setTable: (table) => set({ table }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  clearCart: () => set({
    items: [],
    customerName: '',
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

