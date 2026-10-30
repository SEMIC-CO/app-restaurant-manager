import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import { Card, CardContent, Button, Input, Badge, Switch } from '@/components/ui';
import { toast } from '@/hooks';
import { categoryService, productService } from '@/services';
import { formatCurrency, resolveStorageUrl } from '@/utils';
import type { ApiCategory, ApiProduct, ApiResponse } from '@/types';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PRODUCTS_PAGE_SIZE = 10;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

export function ProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<ApiCategory[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const isFirstSearchRender = React.useRef(true);

  const categoryName = (categoryId: number) =>
    categories.find((category) => category.id === categoryId)?.name ?? '—';

  const load = React.useCallback(
    async (targetPage: number, term: string) => {
      setLoading(true);
      try {
        const resp = await productService.list({
          page: targetPage,
          limit: PRODUCTS_PAGE_SIZE,
          search: term.trim() || undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar productos',
            description: apiErrorMessage(
              resp,
              'No se pudieron cargar los productos.',
            ),
          });
          return;
        }
        setProducts(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar productos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Categorías (para el nombre de la columna y para el diálogo de edición)
  React.useEffect(() => {
    void (async () => {
      try {
        const resp = await categoryService.list({ limit: 100 });
        if (resp.code === 200) {
          setCategories(resp.data.items.filter((category) => category.active));
        }
      } catch {
        /* sin categorías el nombre queda como "—" */
      }
    })();
  }, []);

  React.useEffect(() => {
    void load(1, '');
  }, [load]);

  // Búsqueda con debounce — siempre desde la página 1
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, load]);

  const goToPage = (targetPage: number) => {
    setPage(targetPage);
    void load(targetPage, searchQuery);
  };

  const refreshCurrentPage = () => load(page, searchQuery);

  // Editar: abre el MISMO formulario de creación en modo edición
  const handleEditProduct = (product: ApiProduct) => {
    navigate(`/productos/${product.id}/editar`);
  };

  // Disponibilidad: actualización optimista con reversión si falla
  const handleToggleAvailability = async (
    product: ApiProduct,
    isAvailable: boolean,
  ) => {
    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id ? { ...item, available: isAvailable } : item,
      ),
    );

    const resp = await productService.update(product.id, {
      available: isAvailable,
    });
    if (resp.code !== 200) {
      toast({
        variant: 'warning',
        title: '❌ Error al cambiar disponibilidad',
        description: apiErrorMessage(
          resp,
          'No se pudo actualizar el producto.',
        ),
      });
      void refreshCurrentPage();
    }
  };

  const handleDelete = async (product: ApiProduct) => {
    if (!window.confirm(`¿Seguro que quieres eliminar el producto "${product.name}"?`))
      return;

    const resp = await productService.remove(product.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Producto eliminado',
        description: 'El producto y su imagen se han eliminado correctamente.',
      });
      // Si era el último de la página, vuelve una atrás
      if (products.length === 1 && page > 1) {
        goToPage(page - 1);
      } else {
        await refreshCurrentPage();
      }
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar producto',
        description: apiErrorMessage(resp, 'No se pudo eliminar el producto.'),
      });
    }
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
                placeholder="Buscar por nombre..."
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
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Disponible
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading && products.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-sm text-muted-foreground"
                        >
                          Cargando productos…
                        </td>
                      </tr>
                    )}
                    {!loading && products.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-sm text-muted-foreground"
                        >
                          No se encontraron productos.
                        </td>
                      </tr>
                    )}
                    {products.map((product) => {
                      const imageUrl = resolveStorageUrl(product.imageUrl);
                      return (
                        <tr key={product.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  loading="lazy"
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-lg">
                                  🥟
                                </div>
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">
                              {categoryName(product.categoryId)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">
                              {formatCurrency(Number(product.price))}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">
                              {formatCurrency(Number(product.cost))}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Switch
                              checked={product.available ?? true}
                              onCheckedChange={(checked: boolean) =>
                                void handleToggleAvailability(product, checked)
                              }
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                                className="h-8 w-8"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleDelete(product)}
                                className="h-8 w-8 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {products.length} de {total} productos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || totalPages === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => goToPage(pageNumber)}
                        className="h-8 w-8"
                      >
                        {pageNumber}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || totalPages === 0}
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
