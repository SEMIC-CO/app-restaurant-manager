import type { ReactNode } from 'react';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  /**
   * Renderizado propio por producto (p.ej. Pedidos). Cuando se provee,
   * reemplaza al ProductCard por defecto.
   */
  children?: (product: Product) => ReactNode;
  /** Callback del POS (caja): agrega el producto al carrito. */
  onAddToCart?: (product: Product) => void;
  loading?: boolean;
  /**
   * Densidad alta (Crear Pedido): más columnas, gaps menores y cards
   * compactas. La Caja usa la densidad normal por defecto.
   */
  dense?: boolean;
}

/**
 * Responsive grid of product cards (POS / Caja / Pedidos).
 */
export function ProductGrid({
  products,
  children,
  onAddToCart,
  loading,
  dense,
}: ProductGridProps) {
  // Ancho de card ≈310px fijo (auto-fill con tope): caben las que quepan en
  // el contenedor y en pantallas angostas encoge sin desbordar.
  const columns = dense
    ? 'grid-cols-[repeat(auto-fill,minmax(0,310px))] gap-3'
    : 'grid-cols-[repeat(auto-fill,minmax(0,310px))] gap-4';

  if (loading) {
    return (
      <div className={`grid ${columns}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-4xl">🔍</span>
        <p className="mt-4 text-muted-foreground">
          No se encontraron productos
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${columns}`}>
      {products.map((product) =>
        children ? (
          <div key={product.id}>{children(product)}</div>
        ) : (
          <ProductCard
            key={product.id}
            product={product}
            dense={dense}
            onAddToCart={onAddToCart ?? (() => {})}
          />
        ),
      )}
    </div>
  );
}
