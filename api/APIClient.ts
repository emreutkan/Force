import axios from 'axios';
import { API_URL, REFRESH_URL } from './ApiBase';
import { getAccessToken, getRefreshToken, storeAccessToken } from './Storage';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export default apiClient;


// 1. Request Interceptor: Automatically add the token to every request
apiClient.interceptors.request.use(async (config) => {
    const accessToken = await getAccessToken();
    console.log("Request to:", config.url);
    if (accessToken) {
        console.log("Attaching Access Token:", accessToken.substring(0, 10) + "...");
        config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
        console.log("No Access Token found in storage");
    }
    return config;
});



// 2. Response Interceptor: Handle 401 errors and refresh the token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response, // Return successful responses as is
    async (error) => {
        const originalRequest = error.config;

        // Check if the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (refreshToken) {
                    // Call the refresh endpoint
                    // We use axios directly to avoid infinite loops with the interceptor
                    const response = await axios.post(REFRESH_URL, { refresh: refreshToken });
                    
                    if (response.status === 200) {
                        const newAccessToken = response.data.access;
                        const newRefreshToken = response.data.refresh; // Capture new refresh token if rotated

                        await storeAccessToken(newAccessToken);
                        if (newRefreshToken) {
                            await storeRefreshToken(newRefreshToken); // Save the new refresh token
                        }
                        
                        // Update the header of the original request
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        
                        processQueue(null, newAccessToken);
                        isRefreshing = false;

                        // Retry the original request
                        return apiClient(originalRequest);
                    }
                }
                
                throw new Error("No refresh token or refresh failed");
            } catch (refreshError) {
                // Refresh failed (token expired or invalid)
                // You might want to clear tokens here or redirect to login
                console.log("Refresh token expired or invalid");
                isRefreshing = false;
                processQueue(refreshError, null);
                // Optional: clearTokens(); 
                return Promise.reject(refreshError);
            }
        }

        // Return the error if it wasn't a 401 or if refresh failed
        return Promise.reject(error);
    }
);