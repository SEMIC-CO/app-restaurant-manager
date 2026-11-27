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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  InventoryItemFormDialog,
  type InventoryItemFormSubmit,
} from '@/components/common';
import { toast } from '@/hooks';
import {
  inventoryCategoryService,
  inventoryItemService,
  inventoryMeasurementUnitService,
} from '@/services';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from './api-error-message';
import type {
  ApiInventoryCategory,
  ApiInventoryItem,
  ApiMeasurementUnit,
} from '@/types';

const PAGE_SIZE = 10;

type StatusFilter = 'todas' | 'activas' | 'inactivas';

/**
 * Listado de artículos de inventario con su **stock de la sede** (calculado
 * por el backend desde los movimientos). Incluye búsqueda con debounce, filtro
 * por categoría/estado, paginación y diálogo crear/editar.
 */
export function InventoryItemsPanel() {
  const [items, setItems] = React.useState<ApiInventoryItem[]>([]);
  const [categories, setCategories] = React.useState<ApiInventoryCategory[]>(
    [],
  );
  const [measurementUnits, setMeasurementUnits] = React.useState<
    ApiMeasurementUnit[]
  >([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('todas');
  const [categoryFilter, setCategoryFilter] = React.useState('todas');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ApiInventoryItem | null>(
    null,
  );
  const isFirstSearchRender = React.useRef(true);

  // Categorías de la empresa (selector del filtro y del diálogo)
  React.useEffect(() => {
    void (async () => {
      try {
        const resp = await inventoryCategoryService.list({ limit: 100 });
        if (resp.code === 200) setCategories(resp.data.items);
      } catch {
        /* el listado principal sigue funcionando sin categorías */
      }
    })();
  }, []);

  // Catálogo de unidades de medida (una vez): resuelve baseUnitId → abreviatura
  React.useEffect(() => {
    void (async () => {
      try {
        setMeasurementUnits(await inventoryMeasurementUnitService.getAll());
      } catch {
        /* el listado principal sigue funcionando sin unidades */
      }
    })();
  }, []);

  const load = React.useCallback(
    async (
      targetPage: number,
      term: string,
      status: StatusFilter,
      category: string,
    ) => {
      setLoading(true);
      try {
        const resp = await inventoryItemService.list({
          page: targetPage,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          isActive:
            status === 'activas' ? true : status === 'inactivas' ? false : undefined,
          inventoryCategoryId:
            category === 'todas' ? undefined : Number(category),
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar artículos',
            description: apiErrorMessage(
              resp,
              'No se pudieron cargar los artículos.',
            ),
          });
          return;
        }
        setItems(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar artículos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load(1, '', 'todas', 'todas');
  }, [load]);

  // Búsqueda con debounce y filtros — siempre desde la página 1
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, searchQuery, statusFilter, categoryFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, categoryFilter, load]);

  const goToPage = (targetPage: number) => {
    setPage(targetPage);
    void load(targetPage, searchQuery, statusFilter, categoryFilter);
  };

  const refreshCurrentPage = () =>
    load(page, searchQuery, statusFilter, categoryFilter);

  const handleCreateItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: ApiInventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmitItem = async (data: InventoryItemFormSubmit) => {
    const isEdit = Boolean(editingItem);
    const payload = {
      name: data.name,
      // Sin `code`: lo genera el backend al crear; en edición no se envía.
      description: data.description,
      inventoryCategoryId: data.inventoryCategoryId,
      baseUnitId: data.baseUnitId,
      // Vacío viaja como '' para que el backend lo borre en la edición.
      barcode: data.barcode,
      minimumStock: data.minimumStock,
      maximumStock: data.maximumStock,
      allowMenuConfig: data.allowMenuConfig,
      trackInventory: data.trackInventory,
      isActive: data.isActive,
    };
    const resp =
      isEdit && editingItem
        ? await inventoryItemService.update(editingItem.id, payload)
        : await inventoryItemService.create(payload);

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Artículo actualizado' : '✅ Artículo creado',
        description: isEdit
          ? 'El artículo se ha actualizado correctamente.'
          : `El artículo "${resp.data.name}" se ha creado con el código ${resp.data.code ?? '—'}.`,
      });
      if (!isEdit) {
        setPage(1);
        await load(1, searchQuery, statusFilter, categoryFilter);
      } else {
        await refreshCurrentPage();
      }
    } else {
      const message = apiErrorMessage(
        resp,
        'Ocurrió un error al guardar el artículo.',
      );
      toast({
        variant: 'warning',
        title: isEdit
          ? '❌ Error al actualizar artículo'
          : '❌ Error al crear artículo',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto
      throw new Error(message);
    }
  };

  // Eliminar = desactivación (soft delete en el backend)
  const handleDeleteItem = async (item: ApiInventoryItem) => {
    if (
      !window.confirm(
        `¿Seguro que quieres eliminar el artículo "${item.name}"? Se desactivará.`,
      )
    )
      return;

    const resp = await inventoryItemService.remove(item.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Artículo eliminado',
        description: 'El artículo se ha desactivado correctamente.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar artículo',
        description: apiErrorMessage(resp, 'No se pudo eliminar el artículo.'),
      });
    }
  };

  const handleRestoreItem = async (item: ApiInventoryItem) => {
    const resp = await inventoryItemService.update(item.id, { isActive: true });
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Artículo restaurado',
        description: 'El artículo vuelve a estar activo.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al restaurar artículo',
        description: apiErrorMessage(resp, 'No se pudo restaurar el artículo.'),
      });
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters =
    Boolean(searchQuery) || statusFilter !== 'todas' || categoryFilter !== 'todas';

  const categoryName = (categoryId: number | null) =>
    categoryId
      ? (categories.find((category) => category.id === categoryId)?.name ??
        '—')
      : 'Sin categoría';

  /** Abreviatura de la unidad base del catálogo (`—` si no está asignada). */
  const unitAbbreviation = (baseUnitId: number | null) =>
    baseUnitId != null
      ? (measurementUnits.find((unit) => unit.id === baseUnitId)?.abbreviation ??
        '—')
      : '—';

  /** Mín/Máx compacto: `2 / 20`, `2 / —` si no hay tope. */
  const minMaxLabel = (item: ApiInventoryItem) =>
    `${item.minimumStock} / ${item.maximumStock ?? '—'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos</SelectItem>
              <SelectItem value="activas">Activos</SelectItem>
              <SelectItem value="inactivas">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={handleCreateItem}>
          <Plus className="h-4 w-4" />
          Nuevo Artículo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Artículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Unidad base
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Mín/Máx
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Código de barras
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Costo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Cargando artículos...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <span className="text-4xl">📦</span>
                      <p className="mt-3 font-medium">
                        {hasFilters
                          ? 'No encontramos artículos con esos criterios'
                          : 'Aún no hay artículos de inventario'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters
                          ? 'Prueba con otra búsqueda o cambia los filtros.'
                          : 'Crea el primero con el botón "Nuevo Artículo".'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 font-medium">
                          {item.name}
                          {item.allowMenuConfig && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/10 text-[10px] uppercase text-blue-700 dark:text-blue-400"
                            >
                              Menú
                            </Badge>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {categoryName(item.inventoryCategoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {unitAbbreviation(item.baseUnitId)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.trackInventory ? (
                          <span className="inline-flex flex-col items-end gap-1">
                            <span
                              className={cn(
                                'text-sm font-semibold tabular-nums',
                                (item.currentStock ?? 0) <= 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-foreground',
                              )}
                            >
                              {item.currentStock ?? 0}
                            </span>
                            {/* Stock negativo = se vendió sin existencias: el
                                cobro nunca se bloquea, pero hay que revisarlo */}
                            {(item.currentStock ?? 0) < 0 && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                                ⚠️ Vendido sin existencias
                              </span>
                            )}
                            {item.minimumStock > 0 &&
                              (item.currentStock ?? 0) < item.minimumStock && (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/10 text-[10px] uppercase text-amber-700 dark:text-amber-400"
                                >
                                  Bajo mínimo
                                </Badge>
                              )}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm tabular-nums text-muted-foreground">
                        {minMaxLabel(item)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="block max-w-[140px] truncate font-mono text-xs text-muted-foreground"
                          title={item.barcode ?? undefined}
                        >
                          {item.barcode ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={item.isActive ? 'secondary' : 'outline'}
                          className={cn(
                            'text-[11px] uppercase',
                            item.isActive
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {item.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(item)}
                            className="h-8 w-8"
                            title="Editar artículo"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {item.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item)}
                              className="h-8 w-8 hover:text-destructive"
                              title="Eliminar artículo (desactiva)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreItem(item)}
                              className="h-8 w-8 hover:text-green-600"
                              title="Restaurar artículo"
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
              Mostrando {startItem}–{endItem} de {total} artículos
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

      <InventoryItemFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entity={editingItem ?? undefined}
        categories={categories}
        measurementUnits={measurementUnits}
        onSubmit={handleSubmitItem}
      />
    </div>
  );
}
