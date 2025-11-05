import axios from 'axios';
import { API_URL } from './ApiBase';
import { getAccessToken, getRefreshToken, storeAccessToken } from './Storage';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,

    withCredentials: true,
});

export default apiClient;


// 1. Request Interceptor: Automatically add the token to every request
apiClient.interceptors.request.use(async (config) => {
    const accessToken = await getAccessToken();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});



// 2. Response Interceptor: Handle 401 errors and refresh the token
apiClient.interceptors.response.use(async (response) => {
    if (response.status === 401) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
            if (response.status === 200) {
                await storeAccessToken(response.data.access);
                return response;
            } else {
                return response;
            }
        } else {
            return response;
        }
    }
    return response;
});