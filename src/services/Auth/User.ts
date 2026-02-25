import { useFetch } from "../useFetch";

class User {

    async registerUser(data: any) {
        const resp = await useFetch('register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        return resp;
    }

    async getCountries() {
        const resp = await useFetch('countries', {
            method: 'GET',
        });
        console.log(resp);
        
        
        return resp;
    }

    async getCities(departmentId?: string) {
        const url = departmentId ? `cities?departmentId=${departmentId}` : 'cities';
        const resp = await useFetch(url, {
            method: 'GET',
        });
        
        return resp;
    }

    async getDepartments(countryId?: string) {
        const url = countryId ? `departments?countryId=${countryId}` : 'departments';
        const resp = await useFetch(url, {
            method: 'GET',
        });
        
        return resp;
    }

}

export const userService = new User();
