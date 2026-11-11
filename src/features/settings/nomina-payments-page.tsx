import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  ConfirmDialog,
  ConfirmHighlight,
  PayrollAdjustmentFormDialog,
  PaymentHistoryDialog,
  type PayrollAdjustmentFormData,
} from '@/components/common';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Checkbox,
  Input,
  Label,
  MoneyInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from '@/hooks';
import { payrollService, payrollAdjustmentService } from '@/services';
import { cn } from '@/lib/utils';
import { formatCurrency, resolvePayrollPeriod } from '@/utils';
import {
  PAYROLL_FREQUENCY_LABELS,
  type ApiPayrollPreviewRow,
  type ApiPayrollFrequency,
  type ApiResponse,
  type BatchPaymentItem,
} from '@/types';
import {
  ArrowLeft,
  Calculator,
  History,
  Loader2,
  ReceiptText,
  Wallet,
} from 'lucide-react';

/** Una fila editable de la nómina a pagar. */
interface PayrollRow extends ApiPayrollPreviewRow {
  selected: boolean;
}

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/**
 * Error de pago ya avisado con toast. El `ConfirmDialog` lo detecta para
 * NO cerrarse (permite reintentar) sin duplicar el aviso.
 */
class PayrollPayError extends Error {}

/** `YYYY-MM-DD` (fecha local, sin el corrimiento de UTC del `toISOString`). */
function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ReferencePreset {
  id: string;
  label: string;
  hint: string;
  /** Fecha de referencia que deja seleccionada. */
  date: string;
}

/**
 * Atajos para elegir la **fecha de referencia**: a partir de ella cada
 * empleado resuelve SU período según su frecuencia (diario → ese día,
 * semanal → esa semana, quincenal → esa quincena, mensual → ese mes).
 * Se recalculan en cada montaje por si la pestaña queda abierta al cambiar
 * de día o de mes.
 */
function buildReferencePresets(): ReferencePreset[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toISO(now);

  // Lunes de la semana actual (para que la referencia caiga en esa semana).
  const day = now.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offsetToMonday);

  return [
    { id: 'day', label: 'Día', hint: 'Diarios', date: today },
    { id: 'week', label: 'Semana', hint: 'Semanales', date: toISO(monday) },
    {
      id: 'fortnight',
      label: 'Quincena',
      hint: 'Quincenales',
      // Día 1–15 → primera quincena; 16 en adelante → segunda.
      date: now.getDate() <= 15
        ? toISO(new Date(year, month, 1))
        : toISO(new Date(year, month, 16)),
    },
    {
      id: 'month',
      label: 'Mes',
      hint: 'Mensuales',
      date: toISO(new Date(year, month, 1)),
    },
    {
      id: 'prev-month',
      label: 'Mes anterior',
      hint: 'Mensuales',
      date: toISO(new Date(year, month - 1, 1)),
    },
  ];
}

/** `YYYY-MM-DD` → `dd/MM/aaaa` para mostrar el período en texto. */
function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/**
 * Pagos de nómina: carga la configuración de los empleados del período
 * elegido, permite elegir a quién pagar, ajustar montos y pagar en lote.
 */
export function NominaPaymentsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = React.useState<PayrollRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [paying, setPaying] = React.useState(false);

  const presets = React.useMemo(() => buildReferencePresets(), []);
  const defaultReference =
    presets.find((preset) => preset.id === 'month')?.date ?? toISO(new Date());

  /** Fecha de referencia: cada empleado resuelve su período a partir de ella. */
  const [referenceDate, setReferenceDate] = React.useState(defaultReference);

  const [isPayConfirmOpen, setIsPayConfirmOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] =
    React.useState(false);
  const [adjustmentEmployeeId, setAdjustmentEmployeeId] =
    React.useState<number | null>(null);

  const selectedRows = rows.filter((row) => row.selected);
  const totalSelected = selectedRows.reduce((sum, row) => sum + row.totalPaid, 0);

  const handleLoad = async () => {
    if (!referenceDate) {
      toast({
        variant: 'warning',
        title: '❌ Fecha requerida',
        description: 'Selecciona la fecha de referencia del período.',
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await payrollService.preview({ referenceDate });
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar la nómina',
          description: apiErrorMessage(resp, 'No se pudo cargar la nómina.'),
        });
        return;
      }
      if (resp.data.length === 0) {
        toast({
          variant: 'warning',
          title: 'Sin configuración activa',
          description:
            'No hay empleados con nómina configurada y activa en esta sede.',
        });
        setRows([]);
        setLoaded(true);
        return;
      }
      // Se preseleccionan los empleados activos que todavía NO pagaron.
      setRows(
        resp.data.map((row) => ({ ...row, selected: !row.alreadyPaid })),
      );
      setLoaded(true);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar la nómina',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (employeeId: number, selected: boolean) => {
    setRows((current) =>
      current.map((row) =>
        row.employeeId === employeeId ? { ...row, selected } : row,
      ),
    );
  };

  const toggleAll = (selected: boolean) => {
    setRows((current) =>
      // Los que ya pagaron nunca se seleccionan.
      current.map((row) =>
        row.alreadyPaid ? row : { ...row, selected },
      ),
    );
  };

  const updateRow = (
    employeeId: number,
    patch: Partial<Pick<PayrollRow, 'subtotal' | 'advances' | 'deductions' | 'totalPaid'>>,
  ) => {
    setRows((current) =>
      current.map((row) => (row.employeeId === employeeId ? { ...row, ...patch } : row)),
    );
  };

  /** `totalPaid = subtotal + bonos − adelantos − descuentos` (nunca negativo). */
  const recalc = (employeeId: number) => {
    setRows((current) =>
      current.map((row) => {
        if (row.employeeId !== employeeId) return row;
        return {
          ...row,
          totalPaid: Math.max(
            0,
            row.subtotal + row.bonuses - row.advances - row.deductions,
          ),
        };
      }),
    );
  };

  const changeFrequency = (employeeId: number, frequency: ApiPayrollFrequency) => {
    setRows((current) =>
      current.map((row) => {
        if (row.employeeId !== employeeId) return row;
        // El período depende de la frecuencia: se recalcula al cambiarla.
        const period = referenceDate
          ? resolvePayrollPeriod(frequency, referenceDate)
          : { periodStartDate: row.periodStartDate, periodEndDate: row.periodEndDate };
        return { ...row, frequency, ...period };
      }),
    );
  };

  const handlePay = async () => {
    if (selectedRows.length === 0) return;

    /** Avisa con toast y lanza `PayrollPayError` para que el popup no cierre. */
    const fail = (message: string): never => {
      toast({
        variant: 'warning',
        title: '❌ Error al pagar la nómina',
        description: message,
      });
      throw new PayrollPayError(message);
    };

    setPaying(true);
    try {
      // Cada fila envía SU período (derivado de su frecuencia).
      const items: BatchPaymentItem[] = selectedRows.map((row) => ({
        employeeId: row.employeeId,
        periodStartDate: row.periodStartDate,
        periodEndDate: row.periodEndDate,
        subtotal: row.subtotal,
        totalAdvances: row.advances,
        totalDeductions: row.deductions,
        totalPaid: row.totalPaid,
      }));

      const resp = await payrollService.createBatch({
        status: 'PAID',
        items,
      });

      if (resp.code === 200 || resp.code === 201) {
        const { created, skipped, adjustmentsApplied } = resp.data;
        const skippedText =
          skipped.length > 0
            ? ` ${skipped.length} ${
                skipped.length === 1 ? 'empleado ya tenía' : 'empleados ya tenían'
              } pago en ese período y se omitieron.`
            : '';
        toast({
          variant: 'success',
          title: '✅ Nómina pagada',
          description: `Se pagaron ${created.length} ${
            created.length === 1 ? 'empleado' : 'empleados'
          } por ${formatCurrency(
            created.reduce((sum, payment) => sum + payment.totalPaid, 0),
          )}.${skippedText}${
            adjustmentsApplied > 0
              ? ` Se aplicaron ${adjustmentsApplied} ajustes pendientes.`
              : ''
          }`,
        });
        await handleLoad();
      } else {
        fail(apiErrorMessage(resp, 'No se pudo pagar la nómina.'));
      }
    } catch (error) {
      // `fail` ya avisó con toast: se re-lanza para que el popup NO cierre.
      if (error instanceof PayrollPayError) throw error;
      // El resto son fallos de red.
      fail('No se pudo conectar con el servidor.');
    } finally {
      setPaying(false);
    }
  };

  const openAdjustment = (employeeId: number) => {
    setAdjustmentEmployeeId(employeeId);
    setIsAdjustmentDialogOpen(true);
  };

  const handleSubmitAdjustment = async (data: PayrollAdjustmentFormData) => {
    if (adjustmentEmployeeId === null) return;

    const resp = await payrollAdjustmentService.create({
      employeeId: adjustmentEmployeeId,
      concept: data.concept,
      adjustmentValue: data.adjustmentValue,
      description: data.description ? data.description : null,
      status: data.status === 'APPLIED' ? 'APPLIED' : 'EARRING',
    });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: '✅ Ajuste registrado',
        description: `El ajuste "${resp.data.concept}" quedó pendiente de aplicar.`,
      });
      // Se recarga el cálculo para reflejar el nuevo ajuste.
      await handleLoad();
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar el ajuste.');
      toast({
        variant: 'warning',
        title: '❌ Error al guardar ajuste',
        description: message,
      });
      throw new Error(message);
    }
  };

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {/* Header: la misma barra (con su padding) que el resto de módulos */}
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Button
                  variant="ghost"
                  className="-ml-2 gap-2"
                  onClick={() => navigate('/configuracion/nomina')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Configuración de nómina
                </Button>
                <h1 className="mt-2 text-2xl font-bold">Pagos de nómina</h1>
                <p className="mt-1 text-muted-foreground">
                  Carga la nómina del período, elige a quién pagar y ajusta los
                  montos antes de pagar.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="adjustment-employee" className="text-xs">
                    Empleado
                  </Label>
                  <Select
                    value={adjustmentEmployeeId ? String(adjustmentEmployeeId) : ''}
                    onValueChange={(value) => setAdjustmentEmployeeId(Number(value))}
                  >
                    <SelectTrigger id="adjustment-employee" className="w-[190px]">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {rows.map((row) => (
                        <SelectItem key={row.employeeId} value={String(row.employeeId)}>
                          {row.employeeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => openAdjustment(adjustmentEmployeeId ?? 0)}
                  disabled={adjustmentEmployeeId === null}
                >
                  <ReceiptText className="h-4 w-4" />
                  Agregar adelanto, bono o descuento
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="h-4 w-4" />
                  Pagos realizados
                </Button>
              </div>
            </div>
          </div>

          {/* Selector de fecha de referencia */}
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Referencia:</span>
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={preset.date === referenceDate ? 'default' : 'outline'}
                    title={preset.hint}
                    onClick={() => setReferenceDate(preset.date)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference-date">Fecha de referencia *</Label>
                  <Input
                    id="reference-date"
                    type="date"
                    className="w-[170px]"
                    value={referenceDate}
                    onChange={(event) => setReferenceDate(event.target.value)}
                  />
                </div>
                <Button
                  className="gap-2"
                  onClick={() => void handleLoad()}
                  disabled={loading || !referenceDate}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  Cargar nómina
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Con la referencia del{' '}
                <span className="font-medium text-foreground">
                  {referenceDate ? formatDateOnly(referenceDate) : '—'}
                </span>{' '}
                cada empleado paga <strong>su propio período</strong>: el
                diario paga ese día, el semanal esa semana, el quincenal esa
                quincena y el mensual ese mes.
                {loaded && rows.length > 0 && (
                  <>
                    {' '}
                    · {rows.length}{' '}
                    {rows.length === 1
                      ? 'empleado cargado'
                      : 'empleados cargados'}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Listado a pagar */}
          {loaded && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Nómina del período
                  </CardTitle>
                  <CardDescription>
                    Desmarca a quien no deba pagarse y ajusta los montos antes
                    de pagar
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total a pagar
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalSelected)}
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsPayConfirmOpen(true)}
                    disabled={paying || selectedRows.length === 0}
                    className="gap-2"
                  >
                    {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Pagar nómina ({selectedRows.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {rows.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="font-medium">Sin nómina para cargar</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Configura los pagos de tus empleados para poder cargarlos
                      aquí.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/configuracion/nomina')}
                    >
                      Ir a configuración de nómina
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <Checkbox
                              checked={
                                rows.length > 0 &&
                                rows.some((row) => !row.alreadyPaid) &&
                                selectedRows.length ===
                                  rows.filter((row) => !row.alreadyPaid).length
                              }
                              onCheckedChange={(value) => toggleAll(value === true)}
                              aria-label="Seleccionar todos los no pagados"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Empleado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Frecuencia
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Período a pagar
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Subtotal
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Bonos
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Adelantos
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Descuentos
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Total pagado
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((row) => (
                          <tr
                            key={row.employeeId}
                            className={cn(
                              'hover:bg-muted/50',
                              !row.selected && 'opacity-60',
                              row.alreadyPaid && 'bg-green-500/5',
                            )}
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={row.selected}
                                disabled={row.alreadyPaid}
                                onCheckedChange={(value) =>
                                  toggleRow(row.employeeId, value === true)
                                }
                                aria-label={
                                  row.alreadyPaid
                                    ? `${row.employeeName} ya pagó este período`
                                    : `Pagar a ${row.employeeName}`
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="block text-sm font-medium">
                                {row.employeeName}
                              </span>
                              {row.alreadyPaid ? (
                                <Badge
                                  variant="outline"
                                  className="mt-0.5 inline-flex bg-green-500/10 text-[11px] uppercase text-green-700 dark:text-green-400"
                                >
                                  Pagado este período
                                </Badge>
                              ) : (
                                row.adjustments.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {row.adjustments.length}{' '}
                                    {row.adjustments.length === 1
                                      ? 'ajuste pendiente'
                                      : 'ajustes pendientes'}
                                  </span>
                                )
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={row.frequency}
                                onValueChange={(value) =>
                                  changeFrequency(
                                    row.employeeId,
                                    value as ApiPayrollFrequency,
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-[130px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(
                                    Object.keys(
                                      PAYROLL_FREQUENCY_LABELS,
                                    ) as ApiPayrollFrequency[]
                                  ).map((frequency) => (
                                    <SelectItem key={frequency} value={frequency}>
                                      {PAYROLL_FREQUENCY_LABELS[frequency]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="block">
                                {formatDateOnly(row.periodStartDate)} –{' '}
                                {formatDateOnly(row.periodEndDate)}
                              </span>
                              {row.alreadyPaid && (
                                <span className="text-xs text-muted-foreground">
                                  ya pagado
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <MoneyInput
                                className="h-8 w-[120px] text-right"
                                value={row.subtotal}
                                onValueChange={(value) =>
                                  updateRow(row.employeeId, {
                                    subtotal: Number.isNaN(value) ? 0 : value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                              {formatCurrency(row.bonuses)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <MoneyInput
                                className="h-8 w-[110px] text-right"
                                value={row.advances}
                                onValueChange={(value) =>
                                  updateRow(row.employeeId, {
                                    advances: Number.isNaN(value) ? 0 : value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <MoneyInput
                                className="h-8 w-[110px] text-right"
                                value={row.deductions}
                                onValueChange={(value) =>
                                  updateRow(row.employeeId, {
                                    deductions: Number.isNaN(value) ? 0 : value,
                                  })
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <MoneyInput
                                  className="h-8 w-[120px] text-right font-semibold"
                                  value={row.totalPaid}
                                  onValueChange={(value) =>
                                    updateRow(row.employeeId, {
                                      totalPaid: Number.isNaN(value) ? 0 : value,
                                    })
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Recalcular (subtotal + bonos − adelantos − descuentos)"
                                  onClick={() => recalc(row.employeeId)}
                                >
                                  <Calculator className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Agregar adelanto, bono o descuento"
                                  onClick={() => openAdjustment(row.employeeId)}
                                >
                                  <ReceiptText className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <PayrollAdjustmentFormDialog
            open={isAdjustmentDialogOpen}
            onOpenChange={setIsAdjustmentDialogOpen}
            employeeId={adjustmentEmployeeId ?? 0}
            onSubmit={handleSubmitAdjustment}
          />

          <ConfirmDialog
            open={isPayConfirmOpen}
            onOpenChange={setIsPayConfirmOpen}
            title="Confirmar pago de nómina"
            description={
              <>
                Se pagarán{' '}
                <ConfirmHighlight>
                  {selectedRows.length}{' '}
                  {selectedRows.length === 1 ? 'empleado' : 'empleados'}
                </ConfirmHighlight>{' '}
                con referencia al{' '}
                <ConfirmHighlight>
                  {referenceDate ? formatDateOnly(referenceDate) : '—'}
                </ConfirmHighlight>
                , cada uno en su propio período por{' '}
                <ConfirmHighlight>
                  {formatCurrency(totalSelected)}
                </ConfirmHighlight>
                . Se registrarán los pagos y se aplicarán sus ajustes
                pendientes.
              </>
            }
            confirmLabel="Pagar nómina"
            onConfirm={handlePay}
          />

          <PaymentHistoryDialog
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
          />
        </div>
      }
    />
  );
}
