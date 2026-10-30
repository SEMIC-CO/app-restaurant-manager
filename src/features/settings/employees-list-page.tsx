import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigLayout } from '@/app/layout';
import {
  ConfigSidebar,
  EmployeeFormDialog,
  type EmployeeFormData,
} from '@/components/common';
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
import { employeeService } from '@/services';
import { cn } from '@/lib/utils';
import type { ApiEmployee, ApiResponse } from '@/types';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Wallet,
} from 'lucide-react';

const EMPLOYEES_PAGE_SIZE = 10;

type StatusFilter = 'todas' | 'activos' | 'inactivos';

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string) {
  if (Array.isArray(resp.data)) return resp.data.join(', ');
  return resp.msg || fallback;
}

/** Fecha `YYYY-MM-DD` → `dd/MM/aaaa` (o "—" si no hay fecha). */
function formatDateOnly(value: string | null) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function EmployeesListPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = React.useState<ApiEmployee[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('todas');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<ApiEmployee | null>(null);
  const isFirstSearchRender = React.useRef(true);

  const load = React.useCallback(
    async (targetPage: number, term: string, status: StatusFilter) => {
      setLoading(true);
      try {
        const resp = await employeeService.list({
          page: targetPage,
          limit: EMPLOYEES_PAGE_SIZE,
          search: term.trim() || undefined,
          active:
            status === 'activos' ? true : status === 'inactivos' ? false : undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar empleados',
            description: resp.msg || 'No se pudieron cargar los empleados.',
          });
          return;
        }
        setEmployees(resp.data.items);
        setTotal(resp.data.total);
        setTotalPages(resp.data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar empleados',
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
  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: ApiEmployee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleSubmitEmployee = async (data: EmployeeFormData) => {
    const isEdit = Boolean(editingEmployee);
    const basePayload = {
      name: data.name,
      phone: data.phone,
      email: data.email ? data.email : null,
      birthdate: data.birthdate ? data.birthdate : null,
      active: data.active,
    };
    const resp =
      isEdit && editingEmployee
        ? // En edición `null` limpia el documento; al crear, si no llega, la BD queda en NULL.
          await employeeService.update(editingEmployee.id, {
            ...basePayload,
            noDocument: data.noDocument ? data.noDocument : null,
          })
        : await employeeService.create({
            ...basePayload,
            noDocument: data.noDocument ? data.noDocument : undefined,
          });

    if (resp.code === 200 || resp.code === 201) {
      toast({
        variant: 'success',
        title: isEdit ? '✅ Empleado actualizado' : '✅ Empleado creado',
        description: isEdit
          ? 'El empleado se ha actualizado correctamente.'
          : `El empleado "${resp.data.name}" se ha creado correctamente.`,
      });
      // Al crear, volver a la primera página para verlo enseguida
      if (!isEdit) {
        setPage(1);
        await load(1, searchQuery, statusFilter);
      } else {
        await refreshCurrentPage();
      }
    } else {
      const message = apiErrorMessage(resp, 'Ocurrió un error al guardar el empleado.');
      toast({
        variant: 'warning',
        title: isEdit ? '❌ Error al actualizar empleado' : '❌ Error al crear empleado',
        description: message,
      });
      // Lanza para que el diálogo permanezca abierto (patrón de los formularios)
      throw new Error(message);
    }
  };

  // Eliminar = desactivación (soft delete en el backend)
  const handleDeleteEmployee = async (employee: ApiEmployee) => {
    if (!window.confirm(`¿Seguro que quieres eliminar al empleado "${employee.name}"? Se desactivará.`))
      return;

    const resp = await employeeService.remove(employee.id);
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Empleado eliminado',
        description: 'El empleado se ha desactivado correctamente.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al eliminar empleado',
        description: apiErrorMessage(resp, 'No se pudo eliminar el empleado.'),
      });
    }
  };

  const handleRestoreEmployee = async (employee: ApiEmployee) => {
    const resp = await employeeService.update(employee.id, { active: true });
    if (resp.code === 200) {
      toast({
        variant: 'success',
        title: '✅ Empleado restaurado',
        description: 'El empleado vuelve a estar activo.',
      });
      await refreshCurrentPage();
    } else {
      toast({
        variant: 'warning',
        title: '❌ Error al restaurar empleado',
        description: apiErrorMessage(resp, 'No se pudo restaurar el empleado.'),
      });
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * EMPLOYEES_PAGE_SIZE + 1;
  const endItem = Math.min(page * EMPLOYEES_PAGE_SIZE, total);
  const hasFilters = Boolean(searchQuery) || statusFilter !== 'todas';

  return (
    <ConfigLayout
      sidebar={<ConfigSidebar />}
      main={
        <div className="space-y-6">
          <div className="border-b bg-background px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Empleados</h1>
                <p className="text-muted-foreground">
                  Registra al personal de tu sede y gestiona sus pagos de nómina
                </p>
              </div>
              <Button className="gap-2" onClick={handleCreateEmployee}>
                <Plus className="h-4 w-4" />
                Nuevo Empleado
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, documento o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="employee-status" className="text-sm text-muted-foreground">
                  Estado
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger id="employee-status" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos</SelectItem>
                    <SelectItem value="activos">Activos</SelectItem>
                    <SelectItem value="inactivos">Inactivos</SelectItem>
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
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Nacimiento
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
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          Cargando empleados...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <span className="text-4xl">🧑‍🍳</span>
                          <p className="mt-3 font-medium">
                            {hasFilters
                              ? 'No encontramos empleados con esos criterios'
                              : 'Aún no hay empleados'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {hasFilters
                              ? 'Prueba con otra búsqueda o cambia el filtro de estado.'
                              : 'Registra el primero con el botón "Nuevo Empleado".'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-semibold uppercase">
                                {employee.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-medium block">{employee.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {employee.noDocument ? `CC ${employee.noDocument}` : 'Sin documento'}
                                  {' · '}ID {employee.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="block text-sm">{employee.phone}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.email || 'Sin correo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {formatDateOnly(employee.birthdate)}
                          </td>
                          <td className="px-6 py-4">
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
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/configuracion/empleados/${employee.id}/nomina`)}
                                className="h-8 w-8"
                                title="Ver pagos y ajustes de nómina"
                              >
                                <Wallet className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditEmployee(employee)}
                                className="h-8 w-8"
                                title="Editar empleado"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {employee.active ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteEmployee(employee)}
                                  className="h-8 w-8 hover:text-destructive"
                                  title="Eliminar empleado (desactiva)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRestoreEmployee(employee)}
                                  className="h-8 w-8 hover:text-green-600"
                                  title="Restaurar empleado"
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
                  Mostrando {startItem}–{endItem} de {total} empleados
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

          <EmployeeFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            employee={editingEmployee ?? undefined}
            onSubmit={handleSubmitEmployee}
          />
        </div>
      }
    />
  );
}
