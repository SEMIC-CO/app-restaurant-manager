import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  /** Versión compacta (Crear Pedido): imagen y textos más pequeños. */
  dense?: boolean;
}

/** Cuánto tiempo se muestra el pill "Agregado" tras tocar la card. */
const ADDED_FEEDBACK_MS = 1400;

/**
 * Card de producto en horizontal: **imagen a la izquierda**; a la derecha el
 * nombre, la descripción y el precio (sin badge sobre la imagen).
 * Click = agregar al carrito (Caja y Crear Pedido).
 *
 * Al agregar muestra un pill **"✓ Agregado"** unos segundos para que el
 * usuario vea que el producto entró al pedido (además del toast y del
 * badge del FAB del carrito).
 */
export function ProductCard({ product, onAddToCart, dense }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia el timeout pendiente al desmontar
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleAdd = () => {
    onAddToCart(product);
    setJustAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  };

  return (
    <Card
      className={cn(
        'group relative flex min-w-0 cursor-pointer items-center gap-3 p-3 text-left transition-shadow hover:shadow-lg',
        dense && 'gap-2 p-2',
        justAdded && 'ring-2 ring-primary',
      )}
      onClick={handleAdd}
    >
      {/* Feedback: producto recién agregado al pedido. Va abajo a la derecha
          para no tapar el nombre del producto. */}
      {justAdded && (
        <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-md">
          <Check className="h-3 w-3" />
          Agregado
        </span>
      )}
      {/* Izquierda: imagen del producto */}
      <div
        className={cn(
          'relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted',
          dense && 'h-16 w-16',
        )}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex h-full items-center justify-center text-3xl',
              dense && 'text-xl',
            )}
          >
            🥟
          </div>
        )}
      </div>

      {/* Derecha: nombre, descripción y precio */}
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            'truncate font-semibold text-foreground',
            dense ? 'text-sm font-medium' : 'text-sm',
          )}
          title={product.name}
        >
          {product.name}
        </h3>
        <p
          className={cn(
            'mt-0.5 line-clamp-2 text-muted-foreground',
            dense ? 'text-xs' : 'text-sm',
          )}
          title={product.description}
        >
          {product.description}
        </p>
        <p
          className={cn(
            'mt-1 font-semibold text-primary tabular-nums',
            dense ? 'text-sm' : 'text-base',
          )}
        >
          {formatCurrency(product.price)}
        </p>
      </div>
    </Card>
  );
}
