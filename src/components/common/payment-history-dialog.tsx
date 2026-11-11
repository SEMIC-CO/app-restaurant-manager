import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from '@/hooks';
import { paymentEmployeeService } from '@/services';
import { cn } from '@/lib/utils';
import { formatCurrency, currentMonthRange } from '@/utils';
import {
  type ApiPaymentHistoryRow,
  type ApiPaymentEmployeeStatus,
  type ApiResponse,
} from '@/types';
import { Ban, ChevronLeft, ChevronRight, Loader2, ReceiptText } from 'lucide-react';
import { ConfirmDialog, ConfirmHighlight } from './confirm-dialog';

const PAGE_SIZE = 10;

const STATUS_META: Record<ApiPaymentEmployeeStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  PAID: { label: 'Pagado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  VOIDED: { label: 'Anulado', className: 'text-muted-foreground' },
};

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/** `YYYY-MM-DD` → `dd/MM/aaaa`. */
function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Historial de pagos de la sede: qué período a qué período se pagó, a quién,
 * con qué estado y por cuánto. Filtrable por estado y por rango de período.
 */
export function PaymentHistoryDialog({ open, onOpenChange }: PaymentHistoryDialogProps) {
  const [rows, setRows] = React.useState<ApiPaymentHistoryRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const [statusFilter, setStatusFilter] = React.useState<'todos' | ApiPaymentEmployeeStatus>(
    'todos',
  );
  const [dateFrom, setDateFrom] = React.useState(() => currentMonthRange().from);
  const [dateTo, setDateTo] = React.useState(() => currentMonthRange().to);

  /** Pago elegido para anular y su confirmación. */
  const [voidTarget, setVoidTarget] = React.useState<ApiPaymentHistoryRow | null>(null);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = React.useCallback(
    async (targetPage: number, status: 'todos' | ApiPaymentEmployeeStatus, from: string, to: string) => {
      setLoading(true);
      try {
        const resp = await paymentEmployeeService.history({
          page: targetPage,
          limit: PAGE_SIZE,
          status: status === 'todos' ? undefined : status,
          dateFrom: from || undefined,
          dateTo: to || undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar pagos',
            description: apiErrorMessage(resp, 'No se pudo cargar el historial.'),
          });
          return;
        }
        setRows(resp.data.items);
        setTotal(resp.data.total);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar pagos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const wasOpen = React.useRef(open);

  /**
   * Al abrir: se muestra SIEMPRE el mes en curso (todos los pagos del mes)
   * y se vuelve a la primera página. Si los filtros ya eran el mes, se carga
   * aquí; si cambian, la re-ejecución del efecto por los deps hace la carga
   * (una sola petición en cualquier caso).
   */
  React.useEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!open) return;

    if (justOpened) {
      const month = currentMonthRange();
      setPage(1);
      if (month.from === dateFrom && month.to === dateTo) {
        void load(1, statusFilter, month.from, month.to);
        return;
      }
      setDateFrom(month.from);
      setDateTo(month.to);
      return;
    }

    setPage(1);
    void load(1, statusFilter, dateFrom, dateTo);
  }, [open, load, statusFilter, dateFrom, dateTo]);

  const goToPage = (next: number) => {
    setPage(next);
    void load(next, statusFilter, dateFrom, dateTo);
  };

  const totalPagado = rows.reduce((sum, row) => sum + row.totalPaid, 0);

  /**
   * Anula el pago seleccionado (`DELETE` → status `VOIDED`) y recarga la
   * página actual con los filtros vigentes. Si falla, relanza para que el
   * `ConfirmDialog` permanezca abierto y se pueda reintentar.
   */
  const handleVoid = async () => {
    if (!voidTarget) return;

    let message: string | null = null;
    try {
      const resp = await paymentEmployeeService.remove(voidTarget.id);
      if (resp.code === 200) {
        toast({
          variant: 'success',
          title: '✅ Pago anulado',
          description: `El pago de ${voidTarget.employeeName} quedó anulado (VOIDED).`,
        });
        await load(page, statusFilter, dateFrom, dateTo);
        return;
      }
      message = apiErrorMessage(resp, 'No se pudo anular el pago.');
    } catch {
      message = 'No se pudo conectar con el servidor.';
    }

    toast({
      variant: 'warning',
      title: '❌ Error al anular pago',
      description: message,
    });
    throw new Error(message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Pagos realizados
          </DialogTitle>
          <DialogDescription>
            Historial de pagos de la sede: período de cada pago, a quién se le
            pagó, su estado y el monto. Por defecto se muestra{' '}
            <strong>el mes en curso</strong>; borra las fechas para ver todo el
            historial.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="history-status" className="text-xs">
              Estado
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as 'todos' | ApiPaymentEmployeeStatus)
              }
            >
              <SelectTrigger id="history-status" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="VOIDED">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="history-from" className="text-xs">
              Período desde
            </Label>
            <Input
              id="history-from"
              type="date"
              className="w-[150px]"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="history-to" className="text-xs">
              Período hasta
            </Label>
            <Input
              id="history-to"
              type="date"
              className="w-[150px]"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          {(dateFrom !== '' || dateTo !== '' || statusFilter !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setStatusFilter('todos');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Listado */}
        <div className="max-h-[50vh] overflow-auto rounded-md border">
          <table className="w-full">
            <thead className="sticky top-0 border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Período pagado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Frecuencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fecha de pago
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Subtotal
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total pagado
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
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                    Cargando pagos...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <p className="font-medium">Sin pagos registrados</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aún no se ha pagado nómina en este rango.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const meta = STATUS_META[row.status];
                  return (
                    <tr key={row.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium">
                        {row.employeeName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDateOnly(row.periodStartDate)} –{' '}
                        {formatDateOnly(row.periodEndDate)}
                      </td>
                      <td className="px-4 py-3">
                        {row.frequencyLabel ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] uppercase"
                          >
                            {row.frequencyLabel}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Personalizado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.paymentDate
                          ? new Date(row.paymentDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatCurrency(row.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {formatCurrency(row.totalPaid)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[11px] uppercase', meta.className)}
                        >
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive"
                            disabled={row.status === 'VOIDED'}
                            title={
                              row.status === 'VOIDED'
                                ? 'Ya está anulado'
                                : 'Anular pago'
                            }
                            onClick={() => {
                              setVoidTarget(row);
                              setIsVoidConfirmOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4" />
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

        {/* Pie: totales + paginación */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {total > 0
              ? `Mostrando ${rows.length} de ${total} pagos · página ${page} de ${totalPages}`
              : 'Sin pagos'}
            {rows.length > 0 && (
              <span className="ml-2 font-medium text-foreground">
                Suma visible: {formatCurrency(totalPagado)}
              </span>
            )}
          </span>
          {total > PAGE_SIZE && (
            <span className="inline-flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </span>
          )}
        </div>

        <ConfirmDialog
          open={isVoidConfirmOpen}
          // El destino NO se limpia al cerrar: el texto debe conservarse
          // durante la animación de salida. Se reemplaza al abrir otra vez.
          onOpenChange={setIsVoidConfirmOpen}
          title="Anular pago de nómina"
          description={
            <>
              Se anulará el pago de{' '}
              <ConfirmHighlight>{voidTarget?.employeeName ?? '—'}</ConfirmHighlight>{' '}
              del{' '}
              <ConfirmHighlight>
                {voidTarget
                  ? `${formatDateOnly(voidTarget.periodStartDate)} – ${formatDateOnly(voidTarget.periodEndDate)}`
                  : '—'}
              </ConfirmHighlight>{' '}
              por{' '}
              <ConfirmHighlight>
                {formatCurrency(voidTarget?.totalPaid ?? 0)}
              </ConfirmHighlight>
              . El pago quedará marcado como{' '}
              <strong>anulado (VOIDED)</strong> y contará así en el historial.
            </>
          }
          confirmLabel="Anular pago"
          variant="destructive"
          onConfirm={handleVoid}
        />
      </DialogContent>
    </Dialog>
  );
}
