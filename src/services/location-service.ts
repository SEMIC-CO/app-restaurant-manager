import { apiFetch } from './useFetch';
import type {
  ApiResponse,
  City,
  Country,
  Departament,
  Paginated,
} from '@/types';

/**
 * Servicio de ubicaciones — espejo de los endpoints `locations/*` del backend
 * (LocationsController: countries, departaments, cities).
 */
class LocationService {

    async listCountries(): Promise<Country[]> {
        const resp = await apiFetch<ApiResponse<Country[]>>('locations/countries', {
            method: 'GET',
        });
        return resp.code === 200 ? resp.data : [];
    }

    async listDepartaments(countryId: number): Promise<Departament[]> {
        const resp = await apiFetch<ApiResponse<Departament[]>>(
            `locations/departaments?countryId=${countryId}`,
            { method: 'GET' },
        );
        return resp.code === 200 ? resp.data : [];
    }

    async listCities(departamentId: number): Promise<City[]> {
        const cities: City[] = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= 10) {
            const resp = await apiFetch<ApiResponse<Paginated<City>>>(
                `locations/cities?departamentId=${departamentId}&page=${page}&limit=100`,
                { method: 'GET' },
            );
            if (resp.code !== 200) break;
            cities.push(...resp.data.items);
            totalPages = resp.data.totalPages;
            page++;
        }

        return cities;
    }

}

export const locationService = new LocationService();
