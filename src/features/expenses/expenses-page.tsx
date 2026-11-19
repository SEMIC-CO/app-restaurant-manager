import * as React from 'react';
import { ConfigLayout } from '@/app/layout';
import { ConfigSidebar } from '@/components/common';
import { ExpenseFormDialog, ExpenseTable, type ExpenseFormData } from '@/components/expenses';
import { Button, Input, Label } from '@/components/ui';
import { toast } from '@/hooks';
import { expenseService } from '@/services';
import type { ApiResponse, Expense, Paginated } from '@/types';
import { Plus } from 'lucide-react';

const EXPENSES_PAGE_SIZE = 10;

function apiErrorMessage(resp: ApiResponse<unknown>, fallback: string): string {
  const data: unknown = resp.data;
  if (Array.isArray(data)) return data.join(', ');
  return resp.msg || fallback;
}

/**
 * Gastos operativos de la sede (`/gastos`): listado paginado con filtro de
 * período y alta/edición/anulación de gastos. Los datos alimentan el reporte
 * financiero (`/reportes/financiero`).
 */
export function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null,
  );

  const load = React.useCallback(
    async (targetPage: number, from: string, to: string) => {
      setLoading(true);
      try {
        const resp = await expenseService.list({
          page: targetPage,
          limit: EXPENSES_PAGE_SIZE,
          dateFrom: from || undefined,
          dateTo: to || undefined,
        });
        if (resp.code !== 200) {
          toast({
            variant: 'warning',
            title: '❌ Error al cargar gastos',
            description: apiErrorMessage(resp, 'No se pudieron cargar los gastos.'),
          });
          return;
        }
        const data: Paginated<Expense> = resp.data;
        setExpenses(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast({
          variant: 'warning',
          title: '❌ Error al cargar gastos',
          description: 'No se pudo conectar con el servidor.',
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Cambiar de período (o de fechas) reinicia en la página 1.
  React.useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo]);

  React.useEffect(() => {
    void load(page, dateFrom, dateTo);
  }, [page, dateFrom, dateTo, load]);

  const openCreate = () => {
    setEditingExpense(null);
    setIsDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: ExpenseFormData) => {
    const payload = {
      concept: values.concept.trim(),
      // `none` = sin categoría: `null` la limpia (o nula al crear).
      category: values.category === 'none' ? null : values.category.trim(),
      amount: values.amount,
      expenseDate: values.expenseDate,
      paymentMethod:
        values.paymentMethod && values.paymentMethod !== 'none'
          ? (values.paymentMethod as 'Cash' | 'Card' | 'Transfer')
          : undefined,
      notes: values.notes.trim() || undefined,
    };

    const resp = editingExpense
      ? await expenseService.update(editingExpense.id, payload)
      : await expenseService.create(payload);

    if (resp.code === 200 || resp.code === 201) {
      toast({
        title: editingExpense ? '✅ Gasto actualizado' : '✅ Gasto registrado',
        description: payload.concept,
      });
      setIsDialogOpen(false);
      setEditingExpense(null);
      await load(page, dateFrom, dateTo);
      return;
    }

    toast({
      variant: 'warning',
      title: '❌ No se pudo guardar el gasto',
      description: apiErrorMessage(resp, 'Revisa los datos e inténtalo de nuevo.'),
    });
  };

  const handleDelete = async (expense: Expense) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres anular el gasto "${expense.concept}"? Saldrá de los reportes.`,
    );
    if (!confirmed) return;

    const resp = await expenseService.remove(expense.id);
    if (resp.code === 200) {
      toast({
        title: '🗑️ Gasto anulado',
        description: expense.concept,
      });
      await load(page, dateFrom, dateTo);
      return;
    }

    toast({
      variant: 'warning',
      title: '❌ No se pudo anular el gasto',
      description: apiErrorMessage(resp, 'Inténtalo de nuevo.'),
    });
  };

  return (
    <>
      <ConfigLayout
        sidebar={<ConfigSidebar />}
        main={
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between print:hidden">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gastos Operativos</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Arriendo, servicios y suministros de la sede — alimentan el
                  reporte financiero
                </p>
              </div>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo Gasto
              </Button>
            </div>

            {/* Filtro de período */}
            <div className="flex flex-wrap items-end gap-3 print:hidden">
              <div className="space-y-1">
                <Label
                  htmlFor="expenses-date-from"
                  className="text-xs text-muted-foreground"
                >
                  Desde
                </Label>
                <Input
                  id="expenses-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="expenses-date-to"
                  className="text-xs text-muted-foreground"
                >
                  Hasta
                </Label>
                <Input
                  id="expenses-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-44"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Limpiar
                </Button>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {total} gasto{total === 1 ? '' : 's'} en el período
              </span>
            </div>

            <ExpenseTable
              expenses={expenses}
              totalItems={total}
              currentPage={page}
              totalPages={totalPages}
              loading={loading}
              onPageChange={setPage}
              onEdit={openEdit}
              onDelete={(expense) => void handleDelete(expense)}
            />
          </div>
        }
      />

      <ExpenseFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
        onSubmit={handleSubmit}
      />
    </>
  );
}
