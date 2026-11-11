import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  PaymentEmployeeFormDialog,
  PayrollAdjustmentFormDialog,
  type PaymentEmployeeFormData,
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { toast } from '@/hooks';
import { employeeService, paymentEmployeeService, payrollAdjustmentService } from '@/services';
import { formatCurrency, currentMonthRange } from '@/utils';
import { cn } from '@/lib/utils';
import type {
  ApiEmployee,
  ApiPaymentEmployee,
  ApiPaymentEmployeeStatus,
  ApiPayrollAdjustment,
  ApiPayrollAdjustmentStatus,
  ApiResponse,
} from '@/types';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Ban,
  Wallet,
  ReceiptText,
} from 'lucide-react';

const PAYMENTS_PAGE_SIZE = 10;
const ADJUSTMENTS_PAGE_SIZE = 10;

const PAYMENT_STATUS_META: Record<
  ApiPaymentEmployeeStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: 'Borrador', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  PAID: { label: 'Pagado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  VOIDED: { label: 'Anulado', className: 'text-muted-foreground' },
};

const ADJUSTMENT_STATUS_META: Record<
  ApiPayrollAdjustmentStatus,
  { label: string; className: string }
> = {
  EARRING: { label: 'Pendiente', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  APPLIED: { label: 'Aplicado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  CANCELLED: { label: 'Cancelado', className: 'text-muted-foreground' },
};

type PaymentStatusFilter = 'todos' | ApiPaymentEmployeeStatus;
type AdjustmentStatusFilter = 'todos' | ApiPayrollAdjustmentStatus;
/**
 * Período de la lista de pagos: `mes` = mes en curso (por defecto, trae todos
 * los pagos del mes); `todos` = todo el historial con paginación del servidor.
 */
type PaymentPeriodFilter = 'mes' | 'todos';

/** Límite del listado al filtrar por mes: el endpoint pagina en servidor. */
const MONTH_PAYMENTS_LIMIT = 100;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/** Fecha `YYYY-MM-DD` → `dd/MM/aaaa`. */
function formatDateOnly(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function EmployeePayrollPage() {
  const navigate = useNavigate();
  const params = useParams<{ employeeId: string }>();
  const employeeId = Number(params.employeeId);
  const isValidEmployee = Number.isInteger(employeeId) && employeeId > 0;

  const [employee, setEmployee] = React.useState<ApiEmployee | null>(null);
  const [employeeLoading, setEmployeeLoading] = React.useState(true);
  const [employeeError, setEmployeeError] = React.useState<string | null>(null);

  const [payments, setPayments] = React.useState<ApiPaymentEmployee[]>([]);
  const [paymentsTotal, setPaymentsTotal] = React.useState(0);
  const [paymentsPage, setPaymentsPage] = React.useState(1);
  const [paymentsLoading, setPaymentsLoading] = React.useState(true);
  const [paymentStatusFilter, setPaymentStatusFilter] =
    React.useState<PaymentStatusFilter>('todos');
  const [paymentPeriodFilter, setPaymentPeriodFilter] =
    React.useState<PaymentPeriodFilter>('mes');

  const [adjustments, setAdjustments] = React.useState<ApiPayrollAdjustment[]>([]);
  const [adjustmentsTotal, setAdjustmentsTotal] = React.useState(0);
  const [adjustmentsPage, setAdjustmentsPage] = React.useState(1);
  const [adjustmentsLoading, setAdjustmentsLoading] = React.useState(true);
  const [adjustmentStatusFilter, setAdjustmentStatusFilter] =
    React.useState<AdjustmentStatusFilter>('todos');

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [editingPayment, setEditingPayment] = React.useState<ApiPaymentEmployee | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = React.useState(false);
  const [editingAdjustment, setEditingAdjustment] =
    React.useState<ApiPayrollAdjustment | null>(null);

  // Empleado
  const loadEmployee = React.useCallback(async () => {
    if (!isValidEmployee) {
      setEmployeeLoading(false);
      setEmployeeError('Identificador de empleado inválido.');
      return;
    }
    setEmployeeLoading(true);
    try {
      const resp = await employeeService.getById(employeeId);
      if (resp.code !== 200) {
        setEmployeeError(apiErrorMessage(resp, 'No se pudo cargar el empleado.'));
        return;
      }
      setEmployee(resp.data);
      setEmployeeError(null);
    } catch {
      setEmployeeError('No se pudo conectar con el servidor.');
    } finally {
      setEmployeeLoading(false);
    }
  }, [employeeId, isValidEmployee]);

  // Pagos. El endpoint NO acepta filtros de fecha, así que en `mes` se piden
  // los últimos `MONTH_PAYMENTS_LIMIT` (el backend ordena por `periodStartDate
  // DESC`, los del mes en curso siempre están arriba) y se filtran en cliente.
  const loadPayments = React.useCallback(
    async (
      targetPage: number,
      status: PaymentStatusFilter,
      period: PaymentPeriodFilter,
    ) => {
      if (!isValidEmployee) return;
      const byMonth = period === 'mes';
      setPaymentsLoading(true);
      try {
        const resp = await paymentEmployeeService.list({
          employeeId,
          page: byMonth ? 1 : targetPage,
          limit: byMonth ? MONTH_PAYMENTS_LIMIT : PAYMENTS_PAGE_SIZE,
          status: status === 'todos' ? undefined : status,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar pagos',
            description: resp.msg || 'No se pudieron cargar los pagos.',
          });
          return;
        }
        const month = currentMonthRange();
        const items = byMonth
          ? resp.data.items.filter(
              (payment) =>
                payment.periodStartDate >= month.from &&
                payment.periodStartDate <= month.to,
            )
          : resp.data.items;
        setPayments(items);
        // Con filtro de mes se pagina en cliente: el total es lo filtrado.
        setPaymentsTotal(byMonth ? items.length : resp.data.total);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar pagos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setPaymentsLoading(false);
      }
    },
    [employeeId, isValidEmployee],
  );

  // Ajustes
  const loadAdjustments = React.useCallback(
    async (targetPage: number, status: AdjustmentStatusFilter) => {
      if (!isValidEmployee) return;
      setAdjustmentsLoading(true);
      try {
        const resp = await payrollAdjustmentService.list({
          employeeId,
          page: targetPage,
          limit: ADJUSTMENTS_PAGE_SIZE,
          status: status === 'todos' ? undefined : status,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar ajustes',
            description: resp.msg || 'No se pudieron cargar los ajustes.',
          });
          return;
        }
        setAdjustments(resp.data.items);
        setAdjustmentsTotal(resp.data.total);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar ajustes',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setAdjustmentsLoading(false);
      }
    },
    [employeeId, isValidEmployee],
  );

  React.useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  React.useEffect(() => {
    setPaymentsPage(1);
    void loadPayments(1, paymentStatusFilter, paymentPeriodFilter);
  }, [loadPayments, paymentStatusFilter, paymentPeriodFilter]);

  React.useEffect(() => {
    setAdjustmentsPage(1);
    void loadAdjustments(1, adjustmentStatusFilter);
  }, [loadAdjustments, adjustmentStatusFilter]);

  // Totales de los pagos cargados (los montos los define el usuario).
  const loadedTotals = React.useMemo(() => {
    const activePayments = payments.filter((payment) => payment.status !== 'VOIDED');
    return {
      paid: activePayments.reduce((sum, payment) => sum + payment.totalPaid, 0),
      advances: activePayments.reduce((sum, payment) => sum + payment.totalAdvances, 0),
      deductions: activePayments.reduce((sum, payment) => sum + payment.totalDeductions, 0),
      partial: paymentsTotal > payments.length,
    };
  }, [payments, paymentsTotal]);

  // Pagos: crear / editar / anular
  const handleCreatePayment = () => {
    setEditingPayment(null);
    setIsPaymentDialogOpen(true);
  };

  const handleEditPayment = (payment: ApiPaymentEmployee) => {
    setEditingPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (data: PaymentEmployeeFormData) => {
    const isEdit = Boolean(editingPayment);
    const basePayload = {
      periodStartDate: data.periodStartDate,
      periodEndDate: data.periodEndDate,
      subtotal: data.subtotal,
      totalAdvances: data.totalAdvances,
      totalDeductions: data.totalDeductions,
      totalPaid: data.totalPaid,
      notes: data.notes.trim() || null,
      status: data.status,
    };

    const resp =
      isEdit && editingPayment
        ? await paymentEmployeeService.update(editingPayment.id, basePayload)
        : await paymentEmployeeService.create({ employeeId, ...basePayload });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Pago actualizado' : '✅ Pago registrado',
        description: isEdit
          ? 'El pago se ha actualizado correctamente.'
          : `Se registró un pago de ${formatCurrency(resp.data.totalPaid)}.`,
      });
      if (!isEdit) setPaymentsPage(1);
      await loadPayments(
        isEdit ? paymentsPage : 1,
        paymentStatusFilter,
        paymentPeriodFilter,
      );
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar el pago.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar pago' : '❌ Error al registrar pago',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  const handleVoidPayment = async (payment: ApiPaymentEmployee) => {
    if (
      !window.confirm(
        `¿Anular el pago del ${formatDateOnly(payment.periodStartDate)} al ${formatDateOnly(payment.periodEndDate)}? Se marcará como VOIDED.`,
      )
    )
      return;

    const resp = await paymentEmployeeService.remove(payment.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Pago anulado',
        description: 'El pago se ha anulado (VOIDED) y ya no se puede editar.',
      });
      await loadPayments(paymentsPage, paymentStatusFilter, paymentPeriodFilter);
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al anular pago',
        description: apiErrorMessage(resp, 'No se pudo anular el pago.'),
      });
    }
  };

  // Ajustes: crear / editar / cancelar
  const handleCreateAdjustment = () => {
    setEditingAdjustment(null);
    setIsAdjustmentDialogOpen(true);
  };

  const handleEditAdjustment = (adjustment: ApiPayrollAdjustment) => {
    setEditingAdjustment(adjustment);
    setIsAdjustmentDialogOpen(true);
  };

  const handleSubmitAdjustment = async (data: PayrollAdjustmentFormData) => {
    const isEdit = Boolean(editingAdjustment);
    const basePayload = {
      concept: data.concept,
      adjustmentValue: data.adjustmentValue,
      description: data.description ? data.description : null,
      status: data.status,
    };

    const resp =
      isEdit && editingAdjustment
        ? await payrollAdjustmentService.update(editingAdjustment.id, basePayload)
        : await payrollAdjustmentService.create({
            employeeId,
            ...basePayload,
            // Al crear el backend no acepta CANCELLED (solo se alcanza con DELETE).
            status: data.status === 'CANCELLED' ? 'EARRING' : data.status,
          });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Ajuste actualizado' : '✅ Ajuste creado',
        description: isEdit
          ? 'El ajuste se ha actualizado correctamente.'
          : `El ajuste "${resp.data.concept}" se ha registrado correctamente.`,
      });
      if (!isEdit) setAdjustmentsPage(1);
      await loadAdjustments(isEdit ? adjustmentsPage : 1, adjustmentStatusFilter);
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar el ajuste.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar ajuste' : '❌ Error al crear ajuste',
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleCancelAdjustment = async (adjustment: ApiPayrollAdjustment) => {
    if (!window.confirm(`¿Cancelar el ajuste "${adjustment.concept}"?`)) return;

    const resp = await payrollAdjustmentService.remove(adjustment.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Ajuste cancelado',
        description: 'El ajuste se ha cancelado (CANCELLED) y ya no se puede editar.',
      });
      await loadAdjustments(adjustmentsPage, adjustmentStatusFilter);
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al cancelar ajuste',
        description: apiErrorMessage(resp, 'No se pudo cancelar el ajuste.'),
      });
    }
  };

  const renderBackButton = (
    <Button
      variant="ghost"
      className="gap-2 mb-4"
      onClick={() => navigate('/configuracion/empleados')}
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a empleados
    </Button>
  );

  const employeeHeader = (
    <div className="border-b bg-background px-6 py-4 rounded-lg">
      {renderBackButton}
      {employeeLoading ? (
        <p className="text-sm text-muted-foreground">Cargando empleado...</p>
      ) : employeeError || !employee ? (
        <div>
          <h1 className="text-2xl font-bold">Empleado no disponible</h1>
          <p className="mt-1 text-muted-foreground">{employeeError ?? 'No se encontró el empleado.'}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <Badge
                variant={employee.active ? 'secondary' : 'outline'}
                className={cn(
                  'text-[11px] uppercase',
                  employee.active
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'text-muted-foreground',
                )}
              >
                {employee.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {employee.noDocument ? `CC ${employee.noDocument} · ` : ''}
              {employee.phone}
              {employee.email ? ` · ${employee.email}` : ''}
              {employee.birthdate ? ` · Nac. ${formatDateOnly(employee.birthdate)}` : ''}
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreatePayment}>
            <Plus className="h-4 w-4" />
            Nuevo Pago
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          {employeeHeader}

          {/* Resumen de pagos cargados */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total pagado', value: loadedTotals.paid },
              { label: 'Adelantos', value: loadedTotals.advances },
              { label: 'Descuentos', value: loadedTotals.deductions },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="py-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{formatCurrency(item.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="-mt-4 text-xs text-muted-foreground">
            {loadedTotals.partial
              ? `Suma de ${payments.length} de ${paymentsTotal} pagos (los demás están en otras páginas).`
              : `Suma de ${paymentsTotal} ${
                  paymentsTotal === 1 ? 'pago' : 'pagos'
                }${
                  paymentPeriodFilter === 'mes' ? ' del mes en curso' : ''
                }. Los totales los defines tú al registrar el pago.`}
          </p>

          {/* Pagos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Pagos de nómina
                </CardTitle>
                <CardDescription>
                  Un pago por período de este empleado · por defecto, el mes
                  en curso
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="payment-period-filter"
                  className="text-sm text-muted-foreground"
                >
                  Período
                </Label>
                <Select
                  value={paymentPeriodFilter}
                  onValueChange={(value) =>
                    setPaymentPeriodFilter(value as PaymentPeriodFilter)
                  }
                >
                  <SelectTrigger id="payment-period-filter" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Mes en curso</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <Label htmlFor="payment-filter" className="text-sm text-muted-foreground">
                  Estado
                </Label>
                <Select
                  value={paymentStatusFilter}
                  onValueChange={(value) =>
                    setPaymentStatusFilter(value as PaymentStatusFilter)
                  }
                >
                  <SelectTrigger id="payment-filter" className="w-[150px]">
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
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Período
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Adelantos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Descuentos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Total pagado
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
                    {paymentsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          Cargando pagos...
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center">
                          <p className="font-medium">
                            {paymentPeriodFilter === 'mes'
                              ? 'Sin pagos en el mes en curso'
                              : 'Sin pagos registrados'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Usa el botón "Nuevo Pago" para registrar la primera quincena o mensualidad.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => {
                        const meta = PAYMENT_STATUS_META[payment.status];
                        const isVoided = payment.status === 'VOIDED';
                        return (
                          <tr key={payment.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <span className="block text-sm font-medium">
                                {formatDateOnly(payment.periodStartDate)} –{' '}
                                {formatDateOnly(payment.periodEndDate)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Pago: {new Date(payment.paymentDate).toLocaleDateString()}
                                {payment.notes ? ` · ${payment.notes}` : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(payment.subtotal)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(payment.totalAdvances)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(payment.totalDeductions)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold">
                              {formatCurrency(payment.totalPaid)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={cn('text-[11px] uppercase', meta.className)}
                              >
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isVoided}
                                  onClick={() => handleEditPayment(payment)}
                                  className="h-8 w-8"
                                  title={isVoided ? 'Un pago anulado no se puede editar' : 'Editar pago'}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isVoided}
                                  onClick={() => handleVoidPayment(payment)}
                                  className="h-8 w-8 hover:text-destructive"
                                  title={isVoided ? 'Ya está anulado' : 'Anular pago'}
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
              <div className="border-t px-6 py-3 text-sm text-muted-foreground">
                {paymentsTotal > 0
                  ? paymentPeriodFilter === 'mes'
                    ? `Mostrando ${payments.length} ${
                        payments.length === 1 ? 'pago' : 'pagos'
                      } del mes en curso`
                    : `Mostrando ${payments.length} de ${paymentsTotal} pagos · página ${paymentsPage}`
                  : 'Sin pagos'}
                {paymentPeriodFilter === 'todos' &&
                  paymentsTotal > PAYMENTS_PAGE_SIZE && (
                  <span className="ml-3 inline-flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={paymentsPage <= 1 || paymentsLoading}
                      onClick={() => {
                        const next = paymentsPage - 1;
                        setPaymentsPage(next);
                        void loadPayments(next, paymentStatusFilter, paymentPeriodFilter);
                      }}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        paymentsPage * PAYMENTS_PAGE_SIZE >= paymentsTotal || paymentsLoading
                      }
                      onClick={() => {
                        const next = paymentsPage + 1;
                        setPaymentsPage(next);
                        void loadPayments(next, paymentStatusFilter, paymentPeriodFilter);
                      }}
                    >
                      Siguiente
                    </Button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ajustes de nómina */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5" />
                  Adelantos, bonos y descuentos
                </CardTitle>
                <CardDescription>
                  El valor positivo suma al pago y el negativo lo descuenta
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="adjustment-filter" className="text-sm text-muted-foreground">
                  Estado
                </Label>
                <Select
                  value={adjustmentStatusFilter}
                  onValueChange={(value) =>
                    setAdjustmentStatusFilter(value as AdjustmentStatusFilter)
                  }
                >
                  <SelectTrigger id="adjustment-filter" className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="EARRING">Pendientes</SelectItem>
                    <SelectItem value="APPLIED">Aplicados</SelectItem>
                    <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="gap-2" onClick={handleCreateAdjustment}>
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Descripción
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
                    {adjustmentsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          Cargando ajustes...
                        </td>
                      </tr>
                    ) : adjustments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center">
                          <p className="font-medium">Sin ajustes registrados</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Registra adelantos, bonos o descuentos del empleado.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      adjustments.map((adjustment) => {
                        const meta = ADJUSTMENT_STATUS_META[adjustment.status];
                        const isCancelled = adjustment.status === 'CANCELLED';
                        return (
                          <tr key={adjustment.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 text-sm font-medium">
                              {adjustment.concept}
                            </td>
                            <td
                              className={cn(
                                'px-6 py-4 text-right text-sm font-semibold',
                                adjustment.adjustmentValue < 0 ? 'text-destructive' : undefined,
                              )}
                            >
                              {formatCurrency(adjustment.adjustmentValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {adjustment.description || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={cn('text-[11px] uppercase', meta.className)}
                              >
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isCancelled}
                                  onClick={() => handleEditAdjustment(adjustment)}
                                  className="h-8 w-8"
                                  title={
                                    isCancelled
                                      ? 'Un ajuste cancelado no se puede editar'
                                      : 'Editar ajuste'
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isCancelled}
                                  onClick={() => handleCancelAdjustment(adjustment)}
                                  className="h-8 w-8 hover:text-destructive"
                                  title={isCancelled ? 'Ya está cancelado' : 'Cancelar ajuste'}
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
              <div className="border-t px-6 py-3 text-sm text-muted-foreground">
                {adjustmentsTotal > 0
                  ? `Mostrando ${adjustments.length} de ${adjustmentsTotal} ajustes · página ${adjustmentsPage}`
                  : 'Sin ajustes'}
                {adjustmentsTotal > ADJUSTMENTS_PAGE_SIZE && (
                  <span className="ml-3 inline-flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={adjustmentsPage <= 1 || adjustmentsLoading}
                      onClick={() => {
                        const next = adjustmentsPage - 1;
                        setAdjustmentsPage(next);
                        void loadAdjustments(next, adjustmentStatusFilter);
                      }}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        adjustmentsPage * ADJUSTMENTS_PAGE_SIZE >= adjustmentsTotal ||
                        adjustmentsLoading
                      }
                      onClick={() => {
                        const next = adjustmentsPage + 1;
                        setAdjustmentsPage(next);
                        void loadAdjustments(next, adjustmentStatusFilter);
                      }}
                    >
                      Siguiente
                    </Button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <PaymentEmployeeFormDialog
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            payment={editingPayment ?? undefined}
            employeeId={employeeId}
            onSubmit={handleSubmitPayment}
          />

          <PayrollAdjustmentFormDialog
            open={isAdjustmentDialogOpen}
            onOpenChange={setIsAdjustmentDialogOpen}
            adjustment={editingAdjustment ?? undefined}
            employeeId={employeeId}
            onSubmit={handleSubmitAdjustment}
          />
        </div>
      }
    />
  );
}
