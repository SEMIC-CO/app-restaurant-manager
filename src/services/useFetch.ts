export const useFetch = async (path: string, options?: RequestInit) => {
    const apiUrl = import.meta.env.VITE_URL_API;
    try {
        const response = await fetch(`${apiUrl}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(options?.headers || {}),
            },
            // credentials: "include"
        });

        const data = await response.json();
        // if (!response.ok) {
        //     throw new Error(data.message || 'Network response was not ok');
        // }
        // if (response.status === 401) {
        //     window.dispatchEvent(new Event("unauthorized"));
        // }
        return data;
    } catch (error) {
        console.log('Fetch error:', error);
        throw error;
    }
}