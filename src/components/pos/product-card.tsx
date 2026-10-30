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

/**
 * Card de producto en horizontal: **imagen a la izquierda**; a la derecha el
 * nombre, la descripción y el precio (sin badge sobre la imagen).
 * Click = agregar al carrito (Caja y Crear Pedido).
 */
export function ProductCard({ product, onAddToCart, dense }: ProductCardProps) {
  return (
    <Card
      className={cn(
        'group relative flex min-w-0 cursor-pointer items-center gap-3 p-3 text-left transition-shadow hover:shadow-lg',
        dense && 'gap-2 p-2',
      )}
      onClick={() => onAddToCart(product)}
    >
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
