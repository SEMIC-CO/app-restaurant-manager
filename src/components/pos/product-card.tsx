import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

/**
 * Product card displaying item image, name, description, and price
 * Clicking adds the product to cart
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card 
      className="group relative cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={() => onAddToCart(product)}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            🥟
          </div>
        )}
        
        {/* Price badge */}
        <Badge 
          className="absolute right-2 top-2 bg-primary text-primary-foreground"
        >
          {formatCurrency(product.price)}
        </Badge>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.description}
        </p>
      </div>
    </Card>
  );
}
