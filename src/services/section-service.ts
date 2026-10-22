import { apiFetch } from './useFetch';
import { buildQuery } from './query-utils';
import type {
  ApiResponse,
  CreateSectionPayload,
  ListSectionsParams,
  Paginated,
  Section,
  UpdateSectionPayload,
} from '@/types';

/**
 * Servicio de secciones — espejo de SectionsController
 * (list, getById, create, update, remove). Alcance sede del JWT.
 */
class SectionService {

    async list(params: ListSectionsParams = {}): Promise<ApiResponse<Paginated<Section>>> {
        return apiFetch<ApiResponse<Paginated<Section>>>(
            `sections${buildQuery({ page: params.page ?? 1, limit: params.limit ?? 100, search: params.search })}`,
            { method: 'GET' },
        );
    }

    async getById(id: number): Promise<ApiResponse<Section>> {
        return apiFetch<ApiResponse<Section>>(`sections/${id}`, {
            method: 'GET',
        });
    }

    async create(payload: CreateSectionPayload): Promise<ApiResponse<Section>> {
        return apiFetch<ApiResponse<Section>>('sections', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async update(id: number, payload: UpdateSectionPayload): Promise<ApiResponse<Section>> {
        return apiFetch<ApiResponse<Section>>(`sections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    async remove(id: number): Promise<ApiResponse<null>> {
        return apiFetch<ApiResponse<null>>(`sections/${id}`, {
            method: 'DELETE',
        });
    }

}

export const sectionService = new SectionService();
