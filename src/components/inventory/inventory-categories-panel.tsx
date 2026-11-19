import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  InventoryCategoryFormDialog,
  type InventoryCategoryFormData,
} from '@/components/common';
import { toast } from '@/hooks';
import { inventoryCategoryService } from '@/services';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from './api-error-message';
import type { ApiInventoryCategory } from '@/types';

const PAGE_SIZE = 10;

type StatusFilter = 'todas' | 'activas' | 'inactivas';

/**
 * Listado de categorías de inventario (alcance empresa): búsqueda con
 * debounce, filtro de estado, paginación y diálogo crear/editar.
 */
export function InventoryCategoriesPanel() {
  const [categories, setCategories] = React.useState<ApiInventoryCategory[]>(
    [],
  );
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('todas');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<ApiInventoryCategory | null>(null);
  const isFirstSearchRender = React.useRef(true);

  const load = React.useCallback(
    async (targetPage: number, term: string, status: StatusFilter) => {
      setLoading(true);
      try {
        const resp = await inventoryCategoryService.list({
          page: targetPage,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          isActive:
            status === 'activas' ? true : status === 'inactivas' ? false : undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar categorías',
            description: apiErrorMessage(
              resp,
              'No se pudieron cargar las categorías.',
            ),
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

  // Búsqueda con debounce (y filtros) — siempre desde la página 1
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

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: ApiInventoryCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleSubmitCategory = async (data: InventoryCategoryFormData) => {
    const isEdit = Boolean(editingCategory);
    const payload = {
      name: data.name,
      description: data.description || undefined,
    };
    const resp =
      isEdit && editingCategory
        ? await inventoryCategoryService.update(editingCategory.id, payload)
        : await inventoryCategoryService.create(payload);

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit
          ? '✅ Categoría actualizada'
          : '✅ Categoría creada',
        description: isEdit
          ? 'La categoría se ha actualizado correctamente.'
          : `La categoría "${resp.data.name}" se ha creado correctamente.`,
      });
      if (!isEdit) {
        setPage(1);
        await load(1, searchQuery, statusFilter);
      } else {
        await refreshCurrentPage();
      }
    } else {
      const message = apiErrorMessage(
        resp,
        'Ocurrió un error al guardar la categoría.',
      );
      toast({
        variant: 'warning',
        title: isEdit
          ? '❌ Error al actualizar categoría'
          : '❌ Error al crear categoría',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  // Eliminar = desactivación (soft delete en el backend)
  const handleDeleteCategory = async (category: ApiInventoryCategory) => {
    if (
      !window.confirm(
        `¿Seguro que quieres eliminar la categoría "${category.name}"? Se desactivará.`,
      )
    )
      return;

    const resp = await inventoryCategoryService.remove(category.id);
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

  const handleRestoreCategory = async (category: ApiInventoryCategory) => {
    const resp = await inventoryCategoryService.update(category.id, {
      isActive: true,
    });
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

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters = Boolean(searchQuery) || statusFilter !== 'todas';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
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
            <Label
              htmlFor="inventory-category-status"
              className="text-sm text-muted-foreground"
            >
              Estado
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger id="inventory-category-status" className="w-[150px]">
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

        <Button className="gap-2" onClick={handleCreateCategory}>
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
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
                    Tipo
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
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <span className="text-4xl">🗂️</span>
                      <p className="mt-3 font-medium">
                        {hasFilters
                          ? 'No encontramos categorías con esos criterios'
                          : 'Aún no hay categorías de inventario'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters
                          ? 'Prueba con otra búsqueda o cambia el filtro de estado.'
                          : 'Crea la primera con el botón "Nueva Categoría".'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <span className="font-medium block">{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {category.description || `ID: ${category.id}`}
                        </span>
                      </td>
                      {/* Alcance: SYSTEM = catálogo del sistema (solo lectura) */}
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] uppercase',
                            category.type === 'SYSTEM'
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'border-primary/40 bg-primary/10 text-primary',
                          )}
                        >
                          {category.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={category.isActive ? 'secondary' : 'outline'}
                          className={cn(
                            'text-[11px] uppercase',
                            category.isActive
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {category.type === 'SYSTEM' ? (
                          /* Las categorías del sistema no se editan ni se
                             eliminan desde la aplicación. */
                          <p className="text-center text-xs text-muted-foreground">
                            Solo lectura
                          </p>
                        ) : (
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
                            {category.isActive ? (
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
                        )}
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
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InventoryCategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entity={editingCategory ?? undefined}
        onSubmit={handleSubmitCategory}
      />
    </div>
  );
}
