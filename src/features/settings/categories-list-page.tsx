import { useState } from 'react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface CategoryRow {
  id: string;
  name: string;
  icon?: string;
  order: number;
  productCount: number;
}

const mockCategories: CategoryRow[] = [
  { id: 'empanadas', name: 'Empanadas', icon: '🥟', order: 1, productCount: 5 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', order: 2, productCount: 3 },
  { id: 'combos', name: 'Combos', icon: '🍽️', order: 3, productCount: 2 },
  { id: 'postres', name: 'Postres', icon: '🍰', order: 4, productCount: 0 },
  { id: 'entradas', name: 'Entradas', icon: '🥗', order: 5, productCount: 4 },
  { id: 'salsas', name: 'Salsas y Aderezos', icon: '🥫', order: 6, productCount: 6 },
];

export function CategoriesListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCategories = mockCategories
    .filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => a.order - b.order);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const displayedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleAdd = () => {
    console.log('Add new category');
  };

  const handleEdit = (categoryId: string) => {
    console.log('Edit category:', categoryId);
  };

  const handleDelete = (categoryId: string) => {
    console.log('Delete category:', categoryId);
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Categorías</h1>
                <p className="text-muted-foreground">
                  Administra las categorías y orden de los productos
                </p>
              </div>
              <Button className="gap-2" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-10">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayedCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted cursor-grab text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                              {category.icon ?? '📁'}
                            </div>
                            <div>
                              <span className="font-medium block">{category.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ID: {category.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={category.productCount > 0 ? 'secondary' : 'outline'}>
                            {category.productCount} productos
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(category.id)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
                              className="h-8 w-8 hover:text-destructive"
                              disabled={category.productCount > 0}
                              title={
                                category.productCount > 0
                                  ? 'No se puede eliminar con productos asignados'
                                  : 'Eliminar categoría'
                              }
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

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {displayedCategories.length} de {filteredCategories.length} categorías
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
