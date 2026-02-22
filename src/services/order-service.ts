import type { Order } from '@/types';
import { useCartStore } from '@/store/cart-store';

let orderCounter = 3942; // Starting order number from mockup

export const orderService = {
  createOrder: async (): Promise<Order> => {
    const cart = useCartStore.getState();
    
    orderCounter++;
    
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: `ORD-${orderCounter}`,
      items: [...cart.items],
      subtotal: cart.getSubtotal(),
      tax: cart.getTax(),
      total: cart.getTotal(),
      status: 'pending',
      type: cart.tableNumber ? 'dine-in' : 'takeout',
      tableNumber: cart.tableNumber ?? undefined,
      customerName: cart.customerName || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Simulate API call
    return Promise.resolve(order);
  },

  getOrderById: async (orderId: string): Promise<Order | null> => {
    // Placeholder for API call
    console.log('Fetching order:', orderId);
    return Promise.resolve(null);
  },
};
