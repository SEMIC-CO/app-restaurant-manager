import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  CreateExpensePayload,
  Expense,
  ListExpensesParams,
  Paginated,
  UpdateExpensePayload,
} from '@/types';

/**
 * Servicio de gastos operativos — espejo de ExpensesController
 * (`/expenses`, alcance sede vía JWT).
 *
 * Nota: `remove` en el backend es una anulación lógica (`deleted_at`): el
 * gasto sale del listado y de los reportes, pero queda en la tabla.
 */
class ExpenseService {
  async list(
    params: ListExpensesParams = {},
  ): Promise<ApiResponse<Paginated<Expense>>> {
    return apiFetch<ApiResponse<Paginated<Expense>>>(
      `expenses${buildQuery({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        category: params.category,
        search: params.search,
      })}`,
      { method: 'GET' },
    );
  }

  async getById(id: number): Promise<ApiResponse<Expense>> {
    return apiFetch<ApiResponse<Expense>>(`expenses/${id}`, { method: 'GET' });
  }

  async create(
    payload: CreateExpensePayload,
  ): Promise<ApiResponse<Expense>> {
    return apiFetch<ApiResponse<Expense>>('expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(
    id: number,
    payload: UpdateExpensePayload,
  ): Promise<ApiResponse<Expense>> {
    return apiFetch<ApiResponse<Expense>>(`expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /** Anulación lógica: el gasto queda con `deleted_at` y sale de los reportes. */
  async remove(id: number): Promise<ApiResponse<null>> {
    return apiFetch<ApiResponse<null>>(`expenses/${id}`, { method: 'DELETE' });
  }
}

export const expenseService = new ExpenseService();
