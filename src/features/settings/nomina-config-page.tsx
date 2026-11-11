import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  ConfirmDialog,
  ConfirmHighlight,
  PayrollTemplateFormDialog,
  type PayrollTemplateFormData,
} from '@/components/common';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@/components/ui';
import { toast } from '@/hooks';
import { payrollService } from '@/services';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils';
import {
  PAYROLL_FREQUENCY_LABELS,
  type ApiPayrollTemplateRow,
  type ApiResponse,
} from '@/types';
import {
  Settings2,
  Plus,
  Pencil,
  Ban,
  Wallet,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/**
 * Configuración de la nómina de la sede: un registro por empleado con su
 * frecuencia de pago y su monto base. De aquí sale lo que se carga en
 * "Pagos de nómina" cada período.
 */
export function NominaConfigPage() {
  const navigate = useNavigate();

  const [rows, setRows] = React.useState<ApiPayrollTemplateRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiPayrollTemplateRow | null>(null);
  const [deactivating, setDeactivating] = React.useState<ApiPayrollTemplateRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await payrollService.listTemplates();
      if (resp.code !== 200) {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar la nómina',
          description: apiErrorMessage(resp, 'No se pudo cargar la nómina.'),
        });
        return;
      }
      setRows(resp.data);
    } catch {
      toast({
        variant: 'warning',
        title: '❌ Error al cargar la nómina',
        description: 'No se pudo conectar con el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const configured = rows.filter((row) => row.template);
  const pending = rows.filter((row) => !row.template);

  const handleConfigure = (row: ApiPayrollTemplateRow) => {
    setEditing(row);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: PayrollTemplateFormData) => {
    if (!editing) return;

    const resp = await payrollService.upsertTemplate(editing.employeeId, {
      frequency: data.frequency,
      baseAmount: data.baseAmount,
      notes: data.notes.trim() || null,
      active: data.active,
    });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: '✅ Configuración guardada',
        description: `${editing.employeeName} se paga ${
          PAYROLL_FREQUENCY_LABELS[data.frequency].toLowerCase()
        }.`,
      });
      await load();
    } else {
      const message = apiErrorMessage(
        resp,
        'Ocurrió un error al guardar la configuración.',
      );
      toast({
        variant: 'warning',
        title: '❌ Error al guardar',
        description: message,
      });
      throw new Error(message);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivating) return;

    const resp = await payrollService.deactivateTemplate(deactivating.employeeId);
    if (resp.code === 200 || resp.code === 204) {
      toast({
        variant: 'success',
        title: '✅ Configuración desactivada',
        description: `${deactivating.employeeName} ya no se carga automáticamente.`,
      });
      await load();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al desactivar',
        description: apiErrorMessage(resp, 'No se pudo desactivar.'),
      });
      // Lanza para que el popup permanezca abierto (patrón de los formularios)
      throw new Error(apiErrorMessage(resp, 'No se pudo desactivar.'));
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
                <h1 className="text-2xl font-bold">Configuración de nómina</h1>
                <p className="mt-1 text-muted-foreground">
                  Define la frecuencia y el monto base de cada empleado. Un único
                  registro por empleado.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => navigate('/configuracion/nomina/pagos')}>
                  <Wallet className="h-4 w-4" />
                  Pagos de nómina
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Empleados
                </p>
                <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Configurados
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                  {configured.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sin configurar
                </p>
                <p className="mt-1 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                  {pending.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Listado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Nómina configurada
                </CardTitle>
                <CardDescription>
                  Los empleados sin configuración no se cargan en los pagos
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Frecuencia
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Monto base
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Notas
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          Cargando nómina...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center">
                          <p className="font-medium">Sin empleados en la sede</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Registra empleados desde el módulo de Empleados.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const template = row.template;
                        return (
                          <tr key={row.employeeId} className="hover:bg-muted/50">
                            <td className="px-6 py-4">
                              <span className="block text-sm font-medium">
                                {row.employeeName}
                              </span>
                              {!row.employeeActive && (
                                <span className="text-xs text-muted-foreground">
                                  Empleado inactivo
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {template ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[11px] uppercase',
                                    template.active
                                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                      : 'text-muted-foreground',
                                  )}
                                >
                                  {PAYROLL_FREQUENCY_LABELS[template.frequency]}
                                  {!template.active && ' · Inactiva'}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-500/10 text-[11px] uppercase text-yellow-600 dark:text-yellow-400"
                                >
                                  Sin configurar
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {template
                                ? formatCurrency(template.baseAmount)
                                : '—'}
                            </td>
                            <td className="max-w-[200px] truncate px-6 py-4 text-sm text-muted-foreground">
                              {template?.notes || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleConfigure(row)}
                                  className="h-8 w-8"
                                  title={
                                    template
                                      ? 'Editar configuración'
                                      : 'Configurar nómina'
                                  }
                                >
                                  {template ? (
                                    <Pencil className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                                {template?.active && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeactivating(row)}
                                    className="h-8 w-8 hover:text-destructive"
                                    title="Desactivar configuración"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {pending.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Hay {pending.length}{' '}
              {pending.length === 1 ? 'empleado sin configurar' : 'empleados sin configurar'}.{' '}
              Configúralos para que aparezcan en los pagos de nómina.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/configuracion/nomina/pagos')}
            >
              <Settings2 className="h-4 w-4" />
              Ir a pagos de nómina
            </Button>
          </div>

          <PayrollTemplateFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            template={editing?.template ?? null}
            employeeName={editing?.employeeName ?? ''}
            onSubmit={handleSubmit}
          />

          <ConfirmDialog
            open={deactivating !== null}
            onOpenChange={(open) => {
              if (!open) setDeactivating(null);
            }}
            title="Desactivar configuración"
            description={
              <>
                Se desactivará la configuración de nómina de{' '}
                <ConfirmHighlight>{deactivating?.employeeName}</ConfirmHighlight>.
                Dejará de cargarse en los pagos; el histórico de pagos ya
                registrados no se modifica.
              </>
            }
            confirmLabel="Desactivar"
            variant="destructive"
            onConfirm={handleDeactivate}
          />
        </div>
      }
    />
  );
}
