import { useFetch } from "../useFetch";

class User {

    async registerUser(data: any) {
        const resp = await useFetch('register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log(resp);
        
        return resp;
    }

}

export const userService = new User();
