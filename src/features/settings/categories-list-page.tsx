import * as React from 'react';
import { Palette } from 'lucide-react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar, CategoryFormDialog, type CategoryFormData } from '@/components/common';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from '@/hooks';
import { categoryService } from '@/services';
import { cn } from '@/lib/utils';
import type { ApiCategory, ApiResponse } from '@/types';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES_PAGE_SIZE = 10;

type StatusFilter = 'todas' | 'activas' | 'inactivas';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

export function CategoriesListPage() {
  const [categories, setCategories] = React.useState<ApiCategory[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('todas');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ApiCategory | null>(null);
  const isFirstSearchRender = React.useRef(true);

  const load = React.useCallback(
    async (targetPage: number, term: string, status: StatusFilter) => {
      setLoading(true);
      try {
        const resp = await categoryService.list({
          page: targetPage,
          limit: CATEGORIES_PAGE_SIZE,
          search: term.trim() || undefined,
          active:
            status === 'activas' ? true : status === 'inactivas' ? false : undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar categorías',
            description: resp.msg || 'No se pudieron cargar las categorías.',
          });
          return;
        }
        setCategories(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar categorías',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load(1, '', 'todas');
  }, [load]);

  // Búsqueda con debounce (y filtro de estado) — siempre desde la página 1
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, searchQuery, statusFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, load]);

  const goToPage = (targetPage: number) => {
    setPage(targetPage);
    void load(targetPage, searchQuery, statusFilter);
  };

  const refreshCurrentPage = () => load(page, searchQuery, statusFilter);

  // Crear / editar
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: ApiCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSubmitCategory = async (data: CategoryFormData) => {
    const isEdit = Boolean(editingCategory);
    const payload = { name: data.name, color: data.color || undefined };
    const resp =
      isEdit && editingCategory
        ? await categoryService.update(editingCategory.id, payload)
        : await categoryService.create(payload);

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Categoría actualizada' : '✅ Categoría creada',
        description: isEdit
          ? 'La categoría se ha actualizado correctamente.'
          : `La categoría "${resp.data.name}" se ha creado correctamente.`,
      });
      // Al crear, volver a la primera página para verla enseguida
      if (!isEdit) {
        setPage(1);
        await load(1, searchQuery, statusFilter);
      } else {
        await refreshCurrentPage();
      }
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar la categoría.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar categoría' : '❌ Error al crear categoría',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  // Eliminar = desactivación (soft delete en el backend)
  const handleDeleteCategory = async (category: ApiCategory) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la categoría "${category.name}"? Se desactivará.`))
      return;

    const resp = await categoryService.remove(category.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Categoría eliminada',
        description: 'La categoría se ha desactivado correctamente.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar categoría',
        description: apiErrorMessage(resp, 'No se pudo eliminar la categoría.'),
      });
    }
  };

  const handleRestoreCategory = async (category: ApiCategory) => {
    const resp = await categoryService.update(category.id, { active: true });
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Categoría restaurada',
        description: 'La categoría vuelve a estar activa.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al restaurar categoría',
        description: apiErrorMessage(resp, 'No se pudo restaurar la categoría.'),
      });
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * CATEGORIES_PAGE_SIZE + 1;
  const endItem = Math.min(page * CATEGORIES_PAGE_SIZE, total);

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Administra las categorías de productos de tu sede
                </p>
              </div>
              <Button className="shrink-0 gap-2" onClick={handleCreateCategory}>
                <Plus className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="category-status" className="text-sm text-muted-foreground">
                  Estado
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger id="category-status" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="activas">Activas</SelectItem>
                    <SelectItem value="inactivas">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          Cargando categorías...
                        </td>
                      </tr>
                    ) : categories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <span className="text-4xl">📁</span>
                          <p className="mt-3 font-medium">
                            {searchQuery || statusFilter !== 'todas'
                              ? 'No encontramos categorías con esos criterios'
                              : 'Aún no hay categorías'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {searchQuery || statusFilter !== 'todas'
                              ? 'Prueba con otra búsqueda o cambia el filtro de estado.'
                              : 'Crea la primera con el botón "Nueva Categoría".'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-10 w-10 items-center justify-center rounded-lg text-xl',
                                  !category.color && 'bg-muted',
                                )}
                                style={category.color ? { backgroundColor: category.color } : undefined}
                              >
                                {category.color ? (
                                  <span className="h-4 w-4 rounded-full bg-white/90 shadow-sm" />
                                ) : (
                                  <Palette className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <span className="font-medium block">{category.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ID: {category.id}
                                  {category.color ? ` · ${category.color}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={category.active ? 'secondary' : 'outline'}
                              className={cn(
                                'text-[11px] uppercase',
                                category.active
                                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {category.active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                                className="h-8 w-8"
                                title="Editar categoría"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {category.active ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="h-8 w-8 hover:text-destructive"
                                  title="Eliminar categoría (desactiva)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRestoreCategory(category)}
                                  className="h-8 w-8 hover:text-green-600"
                                  title="Restaurar categoría"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {startItem}–{endItem} de {total} categorías
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? 'default' : 'ghost'}
                        size="icon"
                        onClick={() => goToPage(pageNumber)}
                        className="h-8 w-8"
                      >
                        {pageNumber}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <CategoryFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            category={editingCategory ?? undefined}
            onSubmit={handleSubmitCategory}
          />
        </div>
      }
    />
  );
}
