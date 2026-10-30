import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { formatCurrency } from '@/utils';

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  /** Unidades vendidas en el período. */
  sales: number;
  /** Ingresos (Σ subtotales de línea). */
  revenue: number;
  /** `popular` = más vendido; `lowest` = menos vendido. */
  status: 'popular' | 'normal' | 'lowest';
}

interface ProductTableProps {
  products: ProductRow[];
  /** Total de productos del reporte (para la paginación). */
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAction?: (productId: string) => void;
}

function getStatusBadge(status: ProductRow['status']) {
  switch (status) {
    case 'popular':
      return <Badge variant="success">Más Vendido</Badge>;
    case 'lowest':
      return <Badge variant="warning">Menos Vendido</Badge>;
    default:
      return <Badge variant="secondary">Normal</Badge>;
  }
}

/**
 * Products table with sales data and pagination
 */
export function ProductTable({
  products,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
  onAction,
}: ProductTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <h3 className="font-semibold">Detalle de Productos</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Ventas (Uni)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Ingresos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  Sin ventas de productos en este período.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                        🥟
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${product.categoryColor}20`,
                        color: product.categoryColor,
                        borderColor: product.categoryColor,
                      }}
                    >
                      {product.category}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium">
                    {product.sales}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction?.(product.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {products.length} de {totalItems} productos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
