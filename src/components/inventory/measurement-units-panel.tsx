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
  MEASUREMENT_UNIT_TYPE_LABELS,
  MeasurementUnitFormDialog,
  type MeasurementUnitFormData,
} from '@/components/common';
import { toast } from '@/hooks';
import { inventoryMeasurementUnitService } from '@/services';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from './api-error-message';
import type { ApiMeasurementUnit } from '@/types';

const PAGE_SIZE = 10;

type StatusFilter = 'todas' | 'activas' | 'inactivas';

/**
 * Catálogo de unidades de medida **por sede** (las del sistema + las de la
 * sesión; lo de otra sede no se ve): búsqueda con debounce, filtro de estado,
 * paginación y diálogo crear/editar. Desactivar usa DELETE (soft delete del
 * backend); reactivar usa PUT con `isActive: true`. Solo lectura para las
 * SYSTEM.
 */
export function MeasurementUnitsPanel() {
  const [units, setUnits] = React.useState<ApiMeasurementUnit[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('todas');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<ApiMeasurementUnit | null>(
    null,
  );
  const isFirstSearchRender = React.useRef(true);

  const load = React.useCallback(
    async (targetPage: number, term: string, status: StatusFilter) => {
      setLoading(true);
      try {
        const resp = await inventoryMeasurementUnitService.list({
          page: targetPage,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          isActive:
            status === 'activas' ? true : status === 'inactivas' ? false : undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar unidades',
            description: apiErrorMessage(
              resp,
              'No se pudieron cargar las unidades de medida.',
            ),
          });
          return;
        }
        setUnits(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar unidades',
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

  const handleCreateUnit = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleEditUnit = (unit: ApiMeasurementUnit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleSubmitUnit = async (data: MeasurementUnitFormData) => {
    const isEdit = Boolean(editingUnit);
    const payload = {
      name: data.name,
      abbreviation: data.abbreviation,
      type: data.type,
    };

    if (isEdit && editingUnit) {
      const fieldsChanged =
        payload.name !== editingUnit.name ||
        payload.abbreviation !== editingUnit.abbreviation ||
        payload.type !== editingUnit.type;

      // Reactivar = PUT con isActive; editar una unidad activa = PUT con los
      // campos (y isActive, sin cambio de estado).
      if (data.isActive) {
        const resp = await inventoryMeasurementUnitService.update(
          editingUnit.id,
          { ...payload, isActive: true },
        );
        if (resp.code === 200) {
          toast({
            variant: 'success',
            title: '✅ Unidad actualizada',
            description: 'La unidad se ha actualizado correctamente.',
          });
          await refreshCurrentPage();
        } else {
          const message = apiErrorMessage(
            resp,
            'Ocurrió un error al guardar la unidad.',
          );
          toast({
            variant: 'warning',
            title: '❌ Error al actualizar unidad',
            description: message,
          });
          throw new Error(message);
        }
        return;
      }

      // Apagar el switch con la unidad activa = desactivar vía DELETE. Si
      // además cambiaron los campos, se guardan primero (PUT parcial).
      if (editingUnit.isActive) {
        if (fieldsChanged) {
          const saved = await inventoryMeasurementUnitService.update(
            editingUnit.id,
            payload,
          );
          if (saved.code !== 200) {
            const message = apiErrorMessage(
              saved,
              'Ocurrió un error al guardar la unidad.',
            );
            toast({
              variant: 'warning',
              title: '❌ Error al actualizar unidad',
              description: message,
            });
            throw new Error(message);
          }
        }
        const resp = await inventoryMeasurementUnitService.deactivate(
          editingUnit.id,
        );
        if (resp.code === 200) {
          toast({
            variant: 'success',
            title: '✅ Unidad desactivada',
            description: 'La unidad se ha desactivado correctamente.',
          });
          await refreshCurrentPage();
        } else {
          const message = apiErrorMessage(
            resp,
            'Ocurrió un error al desactivar la unidad.',
          );
          toast({
            variant: 'warning',
            title: '❌ Error al desactivar unidad',
            description: message,
          });
          throw new Error(message);
        }
        return;
      }
      // Unidad ya inactiva: solo actualizar campos (el switch sigue apagado).
    }

    const resp =
      isEdit && editingUnit
        ? await inventoryMeasurementUnitService.update(editingUnit.id, payload)
        : await inventoryMeasurementUnitService.create({
            ...payload,
            isActive: data.isActive,
          });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Unidad actualizada' : '✅ Unidad creada',
        description: isEdit
          ? 'La unidad se ha actualizado correctamente.'
          : `La unidad "${resp.data.name}" se ha creado correctamente.`,
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
        'Ocurrió un error al guardar la unidad.',
      );
      toast({
        variant: 'warning',
        title: isEdit
          ? '❌ Error al actualizar unidad'
          : '❌ Error al crear unidad',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  // Desactivar = DELETE (soft delete en el backend)
  const handleDeactivateUnit = async (unit: ApiMeasurementUnit) => {
    if (
      !window.confirm(
        `¿Seguro que quieres desactivar la unidad "${unit.name}"? No se ofrecerá al configurar artículos.`,
      )
    )
      return;

    const resp = await inventoryMeasurementUnitService.deactivate(unit.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Unidad desactivada',
        description: 'La unidad se ha desactivado correctamente.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al desactivar unidad',
        description: apiErrorMessage(
          resp,
          'No se pudo desactivar la unidad.',
        ),
      });
    }
  };

  const handleReactivateUnit = async (unit: ApiMeasurementUnit) => {
    const resp = await inventoryMeasurementUnitService.update(unit.id, {
      isActive: true,
    });
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Unidad reactivada',
        description: 'La unidad vuelve a estar activa.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al reactivar unidad',
        description: apiErrorMessage(resp, 'No se pudo reactivar la unidad.'),
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
              placeholder="Buscar unidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="measurement-unit-status"
              className="text-sm text-muted-foreground"
            >
              Estado
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger id="measurement-unit-status" className="w-[150px]">
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

        <Button className="gap-2" onClick={handleCreateUnit}>
          <Plus className="h-4 w-4" />
          Nueva Unidad
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Abreviatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </th>
                  {/* Alcance: SYSTEM = catálogo del sistema (solo lectura) */}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Alcance
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
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Cargando unidades...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <span className="text-4xl">📏</span>
                      <p className="mt-3 font-medium">
                        {hasFilters
                          ? 'No encontramos unidades con esos criterios'
                          : 'Aún no hay unidades de medida'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters
                          ? 'Prueba con otra búsqueda o cambia el filtro de estado.'
                          : 'Crea la primera con el botón "Nueva Unidad".'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{unit.name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">
                          {unit.abbreviation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[11px] uppercase">
                          {MEASUREMENT_UNIT_TYPE_LABELS[unit.type] ?? unit.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] uppercase',
                            unit.mode === 'SYSTEM'
                              ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'border-primary/40 bg-primary/10 text-primary',
                          )}
                        >
                          {unit.mode}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={unit.isActive ? 'secondary' : 'outline'}
                          className={cn(
                            'text-[11px] uppercase',
                            unit.isActive
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                              : 'text-muted-foreground',
                          )}
                        >
                          {unit.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {unit.mode === 'SYSTEM' ? (
                          /* Las unidades del sistema no se editan ni se
                             desactivan desde la aplicación; las COMPANY
                             visibles siempre son de esta sede. */
                          <p className="text-center text-xs text-muted-foreground">
                            Solo lectura
                          </p>
                        ) : (
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
                            {unit.isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeactivateUnit(unit)}
                                className="h-8 w-8 hover:text-destructive"
                                title="Desactivar unidad"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReactivateUnit(unit)}
                                className="h-8 w-8 hover:text-green-600"
                                title="Reactivar unidad"
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
              Mostrando {startItem}–{endItem} de {total} unidades
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

      <MeasurementUnitFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entity={editingUnit ?? undefined}
        onSubmit={handleSubmitUnit}
      />
    </div>
  );
}
