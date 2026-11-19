import { ShoppingCart } from 'lucide-react';
import type { ReactNode } from 'react';

interface CartFabProps {
  /** Unidades en el carrito (suma de cantidades); 0 oculta el badge. */
  count: number;
  onClick: () => void;
  /** Texto base del `aria-label` y del tooltip. */
  label?: string;
  /**
   * Ícono del botón. Por defecto el carrito; Pedidos usa el de listado
   * (`ClipboardList`) porque lo que abre es la lista de productos agregados.
   */
  icon?: ReactNode;
}

/**
 * Botón flotante (FAB) del carrito, abajo a la derecha. Solo se muestra en
 * pantallas donde `POSLayout` oculta el panel lateral (`lg:hidden`): en
 * escritorio el panel fijo ya está visible.
 *
 * El badge indica las unidades del pedido y hace un pequeño "pop" al
 * cambiar (la clave `count` re-monta el badge y reproduce la animación).
 */
export function CartFab({ count, onClick, label = 'Abrir carrito', icon }: CartFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} (${count} ${count === 1 ? 'producto' : 'productos'})`}
      title={label}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95 lg:hidden"
    >
      {icon ?? <ShoppingCart className="h-6 w-6" strokeWidth={2.25} />}

      {count > 0 && (
        <span
          key={count}
          className="badge-pop absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-xs font-bold tabular-nums text-destructive-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
