import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  ApiEmployee,
  CreateEmployeePayload,
  ListEmployeesParams,
  Paginated,
  UpdateEmployeePayload,
} from '@/types';

/**
 * Servicio de empleados — espejo de EmployeesController
 * (list, getById, create, update, remove). Alcance sede del JWT.
 *
 * Nota: `remove` en el backend desactiva el empleado (soft delete).
 */
class EmployeeService {
    async list(params: ListEmployeesParams = {}): Promise<ApiResponse<Paginated<ApiEmployee>>> {
        return apiFetch<ApiResponse<Paginated<ApiEmployee>>>(
            `employees${buildQuery({
                page: params.page ?? 1,
                limit: params.limit ?? 100,
                search: params.search,
                active: params.active === undefined ? undefined : String(params.active),
            })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<ApiEmployee>> {
        return apiFetch<ApiResponse<ApiEmployee>>(`employees/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateEmployeePayload): Promise<ApiResponse<ApiEmployee>> {
        return apiFetch<ApiResponse<ApiEmployee>>('employees', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(id: number, payload: UpdateEmployeePayload): Promise<ApiResponse<ApiEmployee>> {
        return apiFetch<ApiResponse<ApiEmployee>>(`employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`employees/${id}`, {
            method: 'DELETE',
        });
    }

}

export const employeeService = new EmployeeService();
