import { apiFetch } from './useFetch';
import type { ApiResponse, Company } from '@/types';

/**
 * Servicio de empresas — espejo de `CompaniesController`
 * (`GET`/`PUT /companies/mine`). Alcance **empresa** del JWT: siempre
 * devuelve y edita la compañía del token, sin importar el id.
 */
class CompanyService {

    /** Empresa del usuario autenticado. */
    async getMine(): Promise<ApiResponse<Company>> {
        return apiFetch<ApiResponse<Company>>('companies/mine', {
            method: 'GET',
        });
    }

    /** Renombra la empresa del usuario autenticado. */
    async updateMine(payload: { name: string }): Promise<ApiResponse<Company>> {
        return apiFetch<ApiResponse<Company>>('companies/mine', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

}

export const companyService = new CompanyService();
