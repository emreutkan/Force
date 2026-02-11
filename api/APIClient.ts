import ky from 'ky';
import { API_URL, REFRESH_URL, getAPI_URL } from './ApiBase';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeAccessToken,
  storeRefreshToken,
} from './Storage';

// Initialize with default (local) API URL
const apiClient = ky.create({
  prefixUrl: API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set('Content-Type', 'application/json');
        request.headers.set('Authorization', `Bearer ${getAccessToken()}`);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          console.log('Unauthorized, refreshing token');
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            await storeAccessToken(refreshToken);
          }
        }
      },
    ],
  },
  retry: {
    limit: 2,
    methods: ['GET', 'PUT'],
  },
});

export default apiClient;
