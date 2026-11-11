import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
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
  INVENTORY_MOVEMENT_BADGE_CLASS,
  INVENTORY_MOVEMENT_LABELS,
  InventoryMovementFormDialog,
  InventoryMovementVoidDialog,
  addsStock,
  type InventoryMovementCorrection,
  type InventoryMovementFormSubmit,
} from '@/components/common';
import { toast } from '@/hooks';
import { inventoryItemService, inventoryMovementService } from '@/services';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from './api-error-message';
import type {
  ApiInventoryItem,
  ApiInventoryMovement,
  InventoryMovementType,
} from '@/types';

const PAGE_SIZE = 10;

type TypeFilter = InventoryMovementType | 'todos';

function formatMovementDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Kardex de movimientos de la sede: historial paginado con filtros (artículo,
 * tipo, fechas, texto) y registro de nuevos movimientos.
 *
 * Los movimientos son **append-only** en el backend, así que un dato mal
 * digitado se corrige de dos formas desde esta pantalla:
 * - **Corregir**: anula el movimiento erróneo y registra el correcto en su
 *   lugar (el original queda marcado, deja de contar para el stock y para el
 *   costo vigente, y la trazabilidad se conserva).
 * - **Anular**: solo anula, sin registrar nada nuevo.
 */
export function InventoryMovementsPanel() {
  const [movements, setMovements] = React.useState<ApiInventoryMovement[]>([]);
  const [items, setItems] = React.useState<ApiInventoryItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('todos');
  const [itemFilter, setItemFilter] = React.useState('todas');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  /** Movimiento que se está corrigiendo (`null` = registro normal). */
  const [correction, setCorrection] =
    React.useState<InventoryMovementCorrection | null>(null);
  /**
   * Id del movimiento original que ya fue anulado en el intento de corrección
   * en curso: evita anular dos veces si el registro del correcto falla y se
   * reintenta.
   */
  const [correctionVoidedId, setCorrectionVoidedId] =
    React.useState<number | null>(null);
  /** Movimiento que se va a anular (`null` = diálogo cerrado). */
  const [voidTarget, setVoidTarget] =
    React.useState<ApiInventoryMovement | null>(null);
  const isFirstSearchRender = React.useRef(true);

  /** Artículos para el selector del diálogo y del filtro (stock de la sede). */
  const loadItems = React.useCallback(async () => {
    try {
      const resp = await inventoryItemService.list({ limit: 100 });
      if (resp.code === 200) setItems(resp.data.items);
    } catch {
      /* el historial sigue funcionando sin el selector de artículos */
    }
  }, []);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const load = React.useCallback(
    async (
      targetPage: number,
      term: string,
      type: TypeFilter,
      item: string,
      from: string,
      to: string,
    ) => {
      setLoading(true);
      try {
        const resp = await inventoryMovementService.list({
          page: targetPage,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          movementType: type === 'todos' ? undefined : type,
          inventoryItemId: item === 'todas' ? undefined : Number(item),
          dateFrom: from || undefined,
          dateTo: to || undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar movimientos',
            description: apiErrorMessage(
              resp,
              'No se pudieron cargar los movimientos.',
            ),
          });
          return;
        }
        setMovements(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar movimientos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load(1, '', 'todos', 'todas', '', '');
  }, [load]);

  // Búsqueda con debounce y filtros — siempre desde la página 1
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, typeFilter, itemFilter, dateFrom, dateTo, load]);

  const goToPage = (targetPage: number) => {
    setPage(targetPage);
    void load(targetPage, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
  };

  /**
   * El `POST /inventory/movements` devuelve el movimiento **sin** `itemName`,
   * así que el nombre se resuelve desde la lista de artículos ya cargada.
   */
  const itemLabel = (itemId: number): string =>
    items.find((item) => item.id === itemId)?.name ?? `#${itemId}`;

  /** Registro normal (sin corrección). */
  const handleCreateMovement = async (data: InventoryMovementFormSubmit) => {
    const resp = await inventoryMovementService.create({
      inventoryItemId: data.inventoryItemId,
      movementType: data.movementType,
      quantity: data.quantity,
      // La entrada informa el TOTAL del lote; la salida, el precio de venta
      totalCost: data.totalCost,
      unitPrice: data.unitPrice,
      reference: data.reference || undefined,
      reason: data.reason || undefined,
    });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: '✅ Movimiento registrado',
        description: `Se registró "${
          INVENTORY_MOVEMENT_LABELS[resp.data.movementType]
        }" de ${resp.data.quantity} para "${itemLabel(resp.data.inventoryItemId)}".`,
      });
      // El movimiento es el más reciente: va a la página 1 con los filtros actuales
      setPage(1);
      await load(1, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
      // El stock de los artículos cambió: refresca el selector
      await loadItems();
    } else {
      const message = apiErrorMessage(
        resp,
        'Ocurrió un error al registrar el movimiento.',
      );
      toast({
        variant: 'warning',
        title: '❌ Error al registrar movimiento',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto
      throw new Error(message);
    }
  };

  /**
   * Abre el formulario de corrección: mismo artículo y tipo que el original,
   * precargado con lo que estaba registrado (cantidad, costo, precio,
   * referencia) para que solo se arregle lo que estaba mal.
   */
  const openCorrection = (movement: ApiInventoryMovement) => {
    setCorrection({
      movementId: movement.id,
      inventoryItemId: movement.inventoryItemId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      reference: movement.reference,
      unitCost: movement.unitCost,
      unitPrice: movement.unitPrice,
    });
    setCorrectionVoidedId(null);
    setIsDialogOpen(true);
  };

  const handleFormDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCorrection(null);
      setCorrectionVoidedId(null);
    }
  };

  /**
   * Corrección en dos pasos que ejecuta el diálogo:
   * 1. **anula** el movimiento erróneo (queda marcado, deja de contar para el
   *    stock y para el costo vigente);
   * 2. **registra** el correcto.
   *
   * Es reintentable a medias: si el paso 2 falla, el paso 1 no se repite y el
   * usuario puede volver a pulsar «Anular y registrar» sin anular dos veces.
   */
  const handleCorrection = async (
    target: InventoryMovementCorrection,
    data: InventoryMovementFormSubmit,
  ) => {
    const voidReason = `Corrección del movimiento #${target.movementId}`;

    if (correctionVoidedId !== target.movementId) {
      let voidResp;
      try {
        voidResp = await inventoryMovementService.void(
          target.movementId,
          voidReason,
        );
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al corregir movimiento',
          description: 'No se pudo conectar con el servidor.',
        });
        throw new Error('Sin conexión con el servidor.');
      }

      if (voidResp.code === 409) {
        // Ya estaba anulado (otro usuario o un intento anterior): seguimos.
        toast({
          variant: 'warning',
          title: '⚠️ Movimiento ya anulado',
          description: `El movimiento #${target.movementId} ya estaba anulado; se registra solo la corrección.`,
        });
      } else if (voidResp.code !== 200) {
        const message = apiErrorMessage(
          voidResp,
          'No se pudo anular el movimiento.',
        );
        toast({
          variant: 'warning',
          title: '❌ Error al corregir movimiento',
          description: message,
        });
        // Lanza para que el diálogo permanezca abierto
        throw new Error(message);
      }
      setCorrectionVoidedId(target.movementId);
    }

    let resp;
    try {
      resp = await inventoryMovementService.create({
        inventoryItemId: data.inventoryItemId,
        movementType: data.movementType,
        quantity: data.quantity,
        totalCost: data.totalCost,
        unitPrice: data.unitPrice,
        reference: data.reference || undefined,
        reason: data.reason || undefined,
      });
    } catch {
      toast({
        variant: 'warning',
        title: '⚠️ Corrección a medias',
        description: `Se anuló el movimiento #${target.movementId} pero se perdió la conexión antes de registrar la corrección. Vuelve a pulsar «Anular y registrar» para reintentar.`,
      });
      await load(page, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
      throw new Error('Sin conexión con el servidor.');
    }

    if (resp.code !== 200 && resp.code !== 201) {
      const message = apiErrorMessage(
        resp,
        'No se pudo registrar la corrección.',
      );
      toast({
        variant: 'warning',
        title: '⚠️ Corrección a medias',
        description: `Se anuló el movimiento #${target.movementId}, pero no se pudo registrar la corrección: ${message}. Vuelve a pulsar «Anular y registrar» para reintentar (no se anulará dos veces).`,
      });
      // El historial ya cambió: refresca para que se vea como anulado
      await load(page, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
      // Lanza para que el diálogo permanezca abierto
      throw new Error(message);
    }

    toast({
      variant: 'success',
      title: '✅ Movimiento corregido',
      description: `Se anuló el movimiento #${target.movementId} y se registró la corrección de "${itemLabel(resp.data.inventoryItemId)}".`,
    });
    setCorrectionVoidedId(null);
    setPage(1);
    await load(1, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
    await loadItems();
  };

  /** Única vía de entrada del diálogo: crea normal o corrige en 2 pasos. */
  const handleSubmitMovement = async (data: InventoryMovementFormSubmit) => {
    if (correction) {
      await handleCorrection(correction, data);
      return;
    }
    await handleCreateMovement(data);
  };

  /** Anula el movimiento seleccionado. Si falla, lanza y el diálogo queda. */
  const handleVoid = async (reason: string) => {
    if (!voidTarget) return;

    let resp;
    try {
      resp = await inventoryMovementService.void(voidTarget.id, reason);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al anular movimiento',
        description: 'No se pudo conectar con el servidor.',
      });
      throw new Error('Sin conexión con el servidor.');
    }

    if (resp.code !== 200) {
      const message = apiErrorMessage(
        resp,
        'No se pudo anular el movimiento.',
      );
      toast({
        variant: 'warning',
        title: '❌ Error al anular movimiento',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto
      throw new Error(message);
    }

    toast({
      variant: 'success',
      title: '✅ Movimiento anulado',
      description: `El movimiento #${resp.data.id} ya no cuenta para el stock ni para el costo vigente.`,
    });
    setVoidTarget(null);
    // El stock de la sede cambió: recarga historial y artículos
    setPage(1);
    await load(1, searchQuery, typeFilter, itemFilter, dateFrom, dateTo);
    await loadItems();
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, total);
  const hasFilters =
    Boolean(searchQuery) ||
    typeFilter !== 'todos' ||
    itemFilter !== 'todas' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por referencia o motivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="ENTRY">Entrada</SelectItem>
              <SelectItem value="EXIT">Salida</SelectItem>
              <SelectItem value="ADJUSTMENT_IN">Ajuste positivo</SelectItem>
              <SelectItem value="ADJUSTMENT_OUT">Ajuste negativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={itemFilter} onValueChange={setItemFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Artículo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los artículos</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            aria-label="Fecha inicial"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="date"
            aria-label="Fecha final"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
          />
        </div>

        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar Movimiento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Artículo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Valor unit.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Referencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Registrado por
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Cargando movimientos...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <span className="text-4xl">📒</span>
                      <p className="mt-3 font-medium">
                        {hasFilters
                          ? 'No encontramos movimientos con esos criterios'
                          : 'Aún no hay movimientos de inventario'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters
                          ? 'Prueba con otras fechas o cambia los filtros.'
                          : 'Registra el primero con "Registrar Movimiento".'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => {
                    const positive = addsStock(movement.movementType);
                    // Boolean (no `!== null`): tolera un backend sin las
                    // columnas de anulación todavía desplegado.
                    const isVoided = Boolean(movement.voidedAt);
                    return (
                      <tr
                        key={movement.id}
                        className={cn(
                          'hover:bg-muted/50',
                          isVoided && 'opacity-70',
                        )}
                      >
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          {formatMovementDate(movement.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">
                          {movement.itemName || `#${movement.inventoryItemId}`}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[11px]',
                                INVENTORY_MOVEMENT_BADGE_CLASS[
                                  movement.movementType
                                ],
                              )}
                            >
                              {INVENTORY_MOVEMENT_LABELS[movement.movementType]}
                            </Badge>
                            {isVoided && (
                              <Badge
                                variant="secondary"
                                className="bg-red-500/10 text-[11px] text-red-600 dark:text-red-400"
                              >
                                Anulado
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td
                          className={cn(
                            'px-4 py-4 text-right text-sm font-semibold tabular-nums whitespace-nowrap',
                            positive
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400',
                            isVoided && 'text-muted-foreground line-through',
                          )}
                        >
                          {positive ? '+' : '−'}
                          {movement.quantity}
                        </td>
                        <td
                          className="px-4 py-4 text-right text-sm"
                          title={
                            movement.unitCost !== null
                              ? 'Costo de la entrada'
                              : movement.unitPrice !== null
                                ? 'Precio de venta (salida)'
                                : undefined
                          }
                        >
                          {movement.unitCost !== null
                            ? formatCurrency(movement.unitCost)
                            : movement.unitPrice !== null
                              ? formatCurrency(movement.unitPrice)
                              : '—'}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="block">{movement.reference || '—'}</span>
                          {movement.reason && (
                            <span className="text-xs text-muted-foreground">
                              {movement.reason}
                            </span>
                          )}
                          {isVoided && (
                            <span className="block text-xs text-red-600 dark:text-red-400">
                              Anulado: {movement.voidReason || 'sin motivo'}
                              {movement.voidedByName
                                ? ` · ${movement.voidedByName}`
                                : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {movement.createdByName || '—'}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {isVoided ? (
                            <span
                              className="block text-right text-xs text-muted-foreground"
                              title="Este movimiento ya fue anulado"
                            >
                              —
                            </span>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCorrection(movement)}
                              >
                                Corregir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                onClick={() => setVoidTarget(movement)}
                              >
                                Anular
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startItem}–{endItem} de {total} movimientos
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

      <InventoryMovementFormDialog
        open={isDialogOpen}
        onOpenChange={handleFormDialogChange}
        items={items}
        onSubmit={handleSubmitMovement}
        correction={correction}
      />

      <InventoryMovementVoidDialog
        open={voidTarget !== null}
        onOpenChange={(open) => {
          if (!open) setVoidTarget(null);
        }}
        movement={voidTarget}
        onConfirm={handleVoid}
      />
    </div>
  );
}
