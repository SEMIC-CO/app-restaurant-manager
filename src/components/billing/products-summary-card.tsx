import { ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface ProductItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ProductsSummaryCardProps {
  products: ProductItem[];
}

/**
 * Products summary table for invoice detail
 */
export function ProductsSummaryCard({ products }: ProductsSummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-6 pb-4">
        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Resumen de Productos</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Producto
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                Cant.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                Unitario
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">
                  {formatCurrency(product.unitPrice)}
                </td>
                <td className="px-6 py-4 text-right font-semibold">
                  {formatCurrency(product.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
