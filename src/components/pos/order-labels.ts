import type { OrderStatus, OrderType } from '@/types';

/** Etiquetas en español de los tipos de orden que soporta el formulario. */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  'para-llevar': 'Para Llevar',
  mesa: 'Mesa',
  domicilio: 'Domicilio',
};

/** Opciones del select de tipo de orden (en el orden en que se muestran). */
export const ORDER_TYPE_OPTIONS: OrderType[] = ['mesa', 'para-llevar', 'domicilio'];

/** Etiquetas en español de los estados de orden. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  ready: 'Lista',
  delivered: 'Entregada',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

/** Estilos del badge de tipo de orden (Mesa / Para Llevar / Domicilio). */
export const ORDER_TYPE_BADGE_CLASSES: Record<OrderType, string> = {
  mesa: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'para-llevar': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  domicilio: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

/** Estilos del badge de estado de orden. */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  ready: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  delivered: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  paid: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};
