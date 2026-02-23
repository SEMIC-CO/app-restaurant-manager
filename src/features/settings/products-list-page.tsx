import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Switch,
} from '@/components/ui';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  cost: number;
  stock: number;
  isAvailable: boolean;
  image?: string;
}

// Mock data
const mockProducts: Product[] = [
  { id: '1', name: 'Empanada de Carne Suave', categoryName: 'Empanadas de Carne', price: 1.50, cost: 0.80, stock: 120, isAvailable: true },
  { id: '2', name: 'Empanada de Pollo', categoryName: 'Empanadas de Pollo', price: 1.50, cost: 0.75, stock: 95, isAvailable: true },
  { id: '3', name: 'Empanada de Queso', categoryName: 'Empanadas de Queso', price: 1.20, cost: 0.60, stock: 80, isAvailable: true },
  { id: '4', name: 'Empanada de Humita', categoryName: 'Empanadas Vegetarianas', price: 1.20, cost: 0.65, stock: 45, isAvailable: false },
  { id: '5', name: 'Coca Cola 500ml', categoryName: 'Bebidas', price: 1.00, cost: 0.50, stock: 200, isAvailable: true },
  { id: '6', name: 'Agua Mineral', categoryName: 'Bebidas', price: 0.80, cost: 0.40, stock: 150, isAvailable: true },
  { id: '7', name: 'Empanada de Carne Picante', categoryName: 'Empanadas de Carne', price: 1.60, cost: 0.85, stock: 70, isAvailable: true },
  { id: '8', name: 'Empanada Caprese', categoryName: 'Empanadas Vegetarianas', price: 1.40, cost: 0.70, stock: 30, isAvailable: true },
];

export function ProductsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleAvailability = (productId: string, isAvailable: boolean) => {
    console.log('Toggle availability:', productId, isAvailable);
    // TODO: Implement toggle availability
  };

  const handleEdit = (productId: string) => {
    navigate(`/productos/editar/${productId}`);
  };

  const handleDelete = (productId: string) => {
    console.log('Delete product:', productId);
    // TODO: Implement delete confirmation
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Productos Registrados</h1>
                <p className="text-muted-foreground">
                  Administra el inventario de productos
                </p>
              </div>
              <Button className="gap-2" onClick={() => navigate('/productos/nuevo')}>
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Costo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Disponible
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-lg">
                              🥟
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{product.categoryName}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-muted-foreground">$</span>
                            <span className="font-medium">{product.price.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-muted-foreground">$</span>
                            <span className="font-medium">{product.cost.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={product.stock < 50 ? 'text-red-500 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Switch
                            checked={product.isAvailable}
                            onCheckedChange={(checked: boolean) =>
                              handleToggleAvailability(product.id, checked)
                            }
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
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
                  Mostrando {displayedProducts.length} de {filteredProducts.length} productos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8"
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
