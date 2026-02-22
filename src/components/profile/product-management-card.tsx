import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button, Switch } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  image?: string;
}

interface ProductManagementCardProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  onAddProduct?: () => void;
  onEditProduct?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onToggleAvailability?: (productId: string, isAvailable: boolean) => void;
  onPageChange?: (page: number) => void;
}

/**
 * Product management table for profile/settings
 */
export function ProductManagementCard({
  products,
  currentPage,
  totalPages,
  totalProducts,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleAvailability,
  onPageChange,
}: ProductManagementCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Mis Productos</h3>
          <p className="text-sm text-muted-foreground">
            Actualiza precios, nombres y disponibilidad de tus productos en tiempo real.
          </p>
        </div>
        <Button className="gap-2" onClick={onAddProduct}>
          <Plus className="h-4 w-4" />
          Agregar Nueva Empanada
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Prod.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Nombre del Producto
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                Precio Base
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                Disponibilidad
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg">🥟</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center rounded-lg border px-3 py-1.5">
                    <span className="text-muted-foreground mr-1">$</span>
                    <span className="font-medium">{product.price.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Switch
                    checked={product.isAvailable}
                    onCheckedChange={(checked: boolean) => onToggleAvailability?.(product.id, checked)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditProduct?.(product.id)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteProduct?.(product.id)}
                      className="h-8 w-8 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {products.length} de {totalProducts} productos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onPageChange?.(page)}
              className="h-8 w-8"
            >
              {page}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
