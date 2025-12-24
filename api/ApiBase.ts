import { Platform } from 'react-native';

// Deployment API (no port) - ACTIVE
const DEPLOYMENT_IP = '16.16.248.86';

// Local API (with port 8000) - COMMENTED OUT
 const LOCAL_IP = '192.168.1.7';

const API_IP = Platform.select({
    // web: DEPLOYMENT_IP,
    // default: DEPLOYMENT_IP
    // For local development, uncomment below and comment above:
    web: LOCAL_IP,
    default: LOCAL_IP
});

// Deployment API (HTTP, no port) - ACTIVE
// export const API_URL = `http://${API_IP}/api`;
// export const BASE_URL = `http://${API_IP}`;

// Local API (HTTP with port 8000) - COMMENTED OUT
export const API_URL = `http://${API_IP}:8000/api`;
export const BASE_URL = `http://${API_IP}:8000`;

// Relative URLs (will be combined with baseURL from APIClient)
export const LOGIN_URL = `/user/login/`;
export const REGISTER_URL = `/user/register/`;
export const REFRESH_URL = `/token/refresh/`;
export const CREATE_WORKOUT_URL = `/workout/create/`;

// Full URL for Google login (uses BASE_URL, not API_URL)
export const GOOGLE_LOGIN_URL = `${BASE_URL}/auth/google/`;
