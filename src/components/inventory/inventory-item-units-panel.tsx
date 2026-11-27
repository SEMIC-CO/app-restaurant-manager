import * as React from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
  InventoryItemUnitFormDialog,
  type InventoryItemUnitFormSubmit,
} from '@/components/common';
import { toast } from '@/hooks';
import {
  inventoryItemService,
  inventoryMeasurementUnitService,
} from '@/services';
import { apiErrorMessage } from './api-error-message';
import type {
  ApiInventoryItem,
  ApiInventoryItemUnit,
  ApiMeasurementUnit,
} from '@/types';

/**
 * Configuración de `inventory_item_units` por artículo: selector de artículo
 * arriba y, con él elegido, la tabla de sus unidades (base + alternativas)
 * con factor de conversión, flags y código de barras.
 */
export function InventoryItemUnitsPanel() {
  const [items, setItems] = React.useState<ApiInventoryItem[]>([]);
  const [measurementUnits, setMeasurementUnits] = React.useState<
    ApiMeasurementUnit[]
  >([]);
  const [itemsLoading, setItemsLoading] = React.useState(true);

  const [selectedItemId, setSelectedItemId] = React.useState('');
  const [units, setUnits] = React.useState<ApiInventoryItemUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = React.useState(false);

  const [itemSearch, setItemSearch] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] =
    React.useState<ApiInventoryItemUnit | null>(null);

  // Catálogo de unidades (una vez): resuelve measurementUnitId → nombre/abrev.
  React.useEffect(() => {
    void (async () => {
      try {
        setMeasurementUnits(await inventoryMeasurementUnitService.getAll());
      } catch {
        /* la tabla sigue funcionando; las etiquetas caen a `#id` */
      }
    })();
  }, []);

  // Artículos para el selector (búsqueda en el servidor, límite holgado)
  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setItemsLoading(true);
        try {
          const resp = await inventoryItemService.list({
            limit: 100,
            search: itemSearch.trim() || undefined,
          });
          if (!cancelled && resp.code === 200) setItems(resp.data.items);
        } catch {
          /* el selector queda vacío; se reintenta al escribir de nuevo */
        } finally {
          if (!cancelled) setItemsLoading(false);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemSearch]);

  // Unidades del artículo elegido
  const loadUnits = React.useCallback(async (itemId: number) => {
    setUnitsLoading(true);
    try {
      const resp = await inventoryItemService.listUnits(itemId);
      if (resp.code === 200) {
        setUnits(resp.data);
      } else {
        setUnits([]);
        toast({
          variant: 'warning',
          title: '❌ Error al cargar unidades',
          description: apiErrorMessage(
            resp,
            'No se pudieron cargar las unidades del artículo.',
          ),
        });
      }
    } catch {
      setUnits([]);
      toast({
        variant: 'warning',
        title: '❌ Error al cargar unidades',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!selectedItemId) {
      setUnits([]);
      return;
    }
    void loadUnits(Number(selectedItemId));
  }, [selectedItemId, loadUnits]);

  const selectedItem =
    items.find((item) => String(item.id) === selectedItemId) ?? null;

  const unitCatalog = (measurementUnitId: number) =>
    measurementUnits.find((unit) => unit.id === measurementUnitId) ?? null;

  /** Unidad base del artículo (fila `isBaseUnit` del listado). */
  const baseUnitRow = units.find((unit) => unit.isBaseUnit) ?? null;
  const baseUnitCatalog = baseUnitRow
    ? unitCatalog(baseUnitRow.measurementUnitId)
    : selectedItem?.baseUnitId != null
      ? unitCatalog(selectedItem.baseUnitId)
      : null;
  const baseAbbrev = baseUnitCatalog?.abbreviation ?? 'base';

  /**
   * Texto de conversión: `1 caja = 12 un` (la unidad base siempre al final).
   * La fila base se muestra como `1 un` (factor 1).
   */
  const conversionLabel = (unit: ApiInventoryItemUnit) => {
    const catalog = unitCatalog(unit.measurementUnitId);
    const abbrev = catalog?.abbreviation ?? `#${unit.measurementUnitId}`;
    if (unit.isBaseUnit) return `1 ${abbrev}`;
    return `1 ${abbrev} = ${unit.conversionFactor} ${baseAbbrev}`;
  };

  /** Unidades del catálogo que el artículo aún no tiene configuradas. */
  const availableUnitOptions = React.useMemo(() => {
    const configured = new Set(units.map((unit) => unit.measurementUnitId));
    return measurementUnits.filter(
      (unit) => unit.isActive && !configured.has(unit.id),
    );
  }, [measurementUnits, units]);

  const handleCreateUnit = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleEditUnit = (unit: ApiInventoryItemUnit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleSubmitUnit = async (data: InventoryItemUnitFormSubmit) => {
    if (!selectedItemId) return;
    const itemId = Number(selectedItemId);
    const isEdit = Boolean(editingUnit);

    const resp =
      isEdit && editingUnit
        ? await inventoryItemService.updateUnit(itemId, editingUnit.id, {
            conversionFactor: data.conversionFactor,
            barcode: data.barcode,
            isPurchaseUnit: data.isPurchaseUnit,
            isDefault: data.isDefault,
          })
        : await inventoryItemService.createUnit(itemId, {
            // En creación la unidad siempre viene del select.
            measurementUnitId: data.measurementUnitId as number,
            conversionFactor: data.conversionFactor,
            barcode: data.barcode,
            isPurchaseUnit: data.isPurchaseUnit,
            isDefault: data.isDefault,
          });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Unidad actualizada' : '✅ Unidad agregada',
        description: isEdit
          ? 'La unidad del artículo se ha actualizado correctamente.'
          : 'La unidad se ha agregado al artículo correctamente.',
      });
      await loadUnits(itemId);
    } else {
      const message = apiErrorMessage(
        resp,
        'Ocurrió un error al guardar la unidad del artículo.',
      );
      toast({
        variant: 'warning',
        title: isEdit
          ? '❌ Error al actualizar unidad'
          : '❌ Error al agregar unidad',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  // Eliminar = quitar la fila del artículo (el backend rechaza la base con 409)
  const handleDeleteUnit = async (unit: ApiInventoryItemUnit) => {
    if (!selectedItemId) return;
    const catalog = unitCatalog(unit.measurementUnitId);
    const label = catalog
      ? `${catalog.name} (${catalog.abbreviation})`
      : `#${unit.measurementUnitId}`;

    if (
      !window.confirm(
        `¿Seguro que quieres quitar la unidad "${label}" de este artículo?`,
      )
    )
      return;

    const resp = await inventoryItemService.deleteUnit(
      Number(selectedItemId),
      unit.id,
    );
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Unidad eliminada',
        description: 'La unidad se ha quitado del artículo.',
      });
      await loadUnits(Number(selectedItemId));
    } else {
      // 409 = es la fila base del artículo: se muestra el msg del envelope.
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar unidad',
        description: apiErrorMessage(resp, 'No se pudo eliminar la unidad.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de artículo (arriba de la tabla de unidades) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar artículo por nombre o código..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={selectedItemId}
            onValueChange={(value) => setSelectedItemId(value)}
          >
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue
                placeholder={
                  itemsLoading ? 'Cargando artículos...' : 'Selecciona un artículo'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {items.length === 0 && !itemsLoading && (
                <SelectItem value="__none" disabled>
                  No hay artículos
                </SelectItem>
              )}
              {items.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                  {item.code ? ` (${item.code})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="gap-2"
          onClick={handleCreateUnit}
          disabled={!selectedItemId}
        >
          <Plus className="h-4 w-4" />
          Nueva Unidad
        </Button>
      </div>

      {!selectedItemId ? (
        <Card>
          <CardContent className="px-6 py-12 text-center">
            <span className="text-4xl">🧭</span>
            <p className="mt-3 font-medium">
              Selecciona un artículo para configurar sus unidades
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Podrás agregar unidades de compra y presentaciones con su factor
              de conversión a la unidad base.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b px-6 py-4">
              <span className="text-sm font-medium">
                {selectedItem?.name ?? `Artículo #${selectedItemId}`}
              </span>
              {selectedItem?.code && (
                <Badge variant="outline" className="text-[11px]">
                  {selectedItem.code}
                </Badge>
              )}
              {baseUnitCatalog && (
                <span className="text-xs text-muted-foreground">
                  · Unidad base: {baseUnitCatalog.name} (
                  {baseUnitCatalog.abbreviation})
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Unidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Factor de conversión
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Base
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Compra
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Por defecto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Código de barras
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {unitsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        Cargando unidades...
                      </td>
                    </tr>
                  ) : units.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <span className="text-4xl">📏</span>
                        <p className="mt-3 font-medium">
                          Este artículo aún no tiene unidades alternativas
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Agrega unidades de compra o presentaciones con el
                          botón "Nueva Unidad".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    units.map((unit) => {
                      const catalog = unitCatalog(unit.measurementUnitId);
                      return (
                        <tr key={unit.id} className="hover:bg-muted/50">
                          <td className="px-4 py-4">
                            <span className="block font-medium">
                              {catalog?.name ?? `#${unit.measurementUnitId}`}
                            </span>
                            <span className="block font-mono text-xs text-muted-foreground">
                              {catalog?.abbreviation ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm tabular-nums">
                            {conversionLabel(unit)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {unit.isBaseUnit ? (
                              <Badge className="bg-blue-500/10 text-[10px] uppercase text-blue-700 dark:text-blue-400">
                                Base
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-sm">
                            {unit.isPurchaseUnit ? 'Sí' : '—'}
                          </td>
                          <td className="px-4 py-4 text-center text-sm">
                            {unit.isDefault ? 'Sí' : '—'}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="block max-w-[140px] truncate font-mono text-xs text-muted-foreground"
                              title={unit.barcode ?? undefined}
                            >
                              {unit.barcode ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUnit(unit)}
                                className="h-8 w-8"
                                title="Editar unidad"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUnit(unit)}
                                className="h-8 w-8 hover:text-destructive"
                                title="Quitar unidad del artículo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!unitsLoading && units.length > 0 && (
              <div className="border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {units.length} unidad{units.length === 1 ? '' : 'es'} en este
                  artículo · La unidad base no se puede quitar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <InventoryItemUnitFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entity={editingUnit ?? undefined}
        unitOptions={availableUnitOptions}
        onSubmit={handleSubmitUnit}
      />
    </div>
  );
}
