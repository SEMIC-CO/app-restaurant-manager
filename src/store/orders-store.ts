import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';

interface OrdersState {
  orders: Order[];

  // Actions
  /** Reemplaza la lista con los pedidos del backend (carga inicial/recarga). */
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingCount: () => number;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],

  setOrders: (orders) => set({ orders }),

  addOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      ),
    }));
  },

  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status);
  },

  getPendingCount: () => {
    return get().orders.filter(
      order => order.status === 'pending' || order.status === 'preparing'
    ).length;
  },
}));
