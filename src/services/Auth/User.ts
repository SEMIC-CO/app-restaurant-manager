import { apiFetch } from "../useFetch";
import type {
  ActivateAccountPayload,
  ApiResponse,
  City,
  Country,
  Departament,
  MessageResponse,
  Paginated,
  RegisterPayload,
  RegisterResponse,
  ResendActivationPayload,
} from "@/types";

class User {

    async registerUser(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
        return apiFetch<ApiResponse<RegisterResponse>>('auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async activateAccount(payload: ActivateAccountPayload): Promise<ApiResponse<MessageResponse | null>> {
        return apiFetch<ApiResponse<MessageResponse | null>>('auth/activate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async resendActivation(payload: ResendActivationPayload): Promise<ApiResponse<MessageResponse>> {
        return apiFetch<ApiResponse<MessageResponse>>('auth/resend-activation', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getCountries(): Promise<Country[]> {
        const resp = await apiFetch<ApiResponse<Country[]>>('locations/countries', {
            method: 'GET',
        });
        return resp.code === 200 ? resp.data : [];
    }

    async getDepartments(countryId: number): Promise<Departament[]> {
        const resp = await apiFetch<ApiResponse<Departament[]>>(`locations/departaments?countryId=${countryId}`, {
            method: 'GET',
        });
        return resp.code === 200 ? resp.data : [];
    }

    async getCities(departamentId: number): Promise<City[]> {
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

export const userService = new User();
