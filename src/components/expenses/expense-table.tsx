import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { Expense, ExpensePaymentMethod } from '@/types';

const PAYMENT_LABELS: Record<ExpensePaymentMethod, string> = {
  Cash: 'Efectivo',
  Card: 'Tarjeta',
  Transfer: 'Transferencia',
};

interface ExpenseTableProps {
  expenses: Expense[];
  /** Total de gastos del filtro (para la paginación). */
  totalItems: number;
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

/** Fecha `YYYY-MM-DD` → `dd/MM/aaaa` (o "—" si no hay fecha). */
function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function paymentBadge(method: ExpensePaymentMethod | null) {
  if (!method) return <Badge variant="secondary">Sin método</Badge>;
  return <Badge variant="outline">{PAYMENT_LABELS[method]}</Badge>;
}

/**
 * Listado de gastos operativos con paginación y acciones
 * (editar / anular). Mismo patrón visual que las tablas de Reportes.
 */
export function ExpenseTable({
  expenses,
  totalItems,
  currentPage,
  totalPages,
  loading = false,
  onPageChange,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-6">
        <h3 className="font-semibold">Gastos Registrados</h3>
        <span className="text-sm text-muted-foreground">
          {totalItems} registro{totalItems === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Concepto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                Método
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                Monto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && expenses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  Cargando gastos…
                </td>
              </tr>
            )}
            {!loading && expenses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No hay gastos en este período.
                </td>
              </tr>
            )}
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b last:border-b-0">
                <td className="px-6 py-4 text-sm">
                  {formatDateOnly(expense.expenseDate)}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div>{expense.concept}</div>
                  {expense.notes && (
                    <p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground">
                      {expense.notes}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {expense.category ?? '—'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {paymentBadge(expense.paymentMethod)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Editar gasto ${expense.concept}`}
                      onClick={() => onEdit(expense)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Anular gasto ${expense.concept}`}
                      onClick={() => onDelete(expense)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {Math.max(1, totalPages)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-md border p-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Página siguiente"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-md border p-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
