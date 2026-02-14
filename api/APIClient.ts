import ky from 'ky';
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeAccessToken,
  storeRefreshToken,
} from '../hooks/Storage';
import { REFRESH_TOKEN_URL, BACKEND_URL } from './types';
import { RefreshTokenResponse } from './types/auth';
// Backend configurations
// const BACKEND_URL = 'api.utrack.irfanemreutkan.com';

const apiClient = ky.create({
  prefixUrl: BACKEND_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await getAccessToken();

        request.headers.set('Content-Type', 'application/json');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        console.log('request', request);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        console.log('[API] afterResponse - Status:', response.status, 'URL:', request.url);

        if (response.status !== 401) {
          return response;
        }

        console.log('response is 401', response.status, response);
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          console.error('[API] No refresh token found, clearing tokens');
          await clearTokens();
          throw new Error('Refresh token not found');
        }

        try {
          console.log('[API] Calling refresh endpoint');
          const res = await ky.post(REFRESH_TOKEN_URL, {
            json: { refresh: refreshToken },
            prefixUrl: undefined,
          });

          const data: RefreshTokenResponse = await res.json();
          console.log('[API] Token refresh successful');

          await storeAccessToken(data.access);
          await storeRefreshToken(data.refresh);

          console.log('[API] Retrying original request with new token');
          return ky(request.url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${data.access}`,
            },
          });
        } catch (error) {
          console.error('[API] Token refresh failed:', error);
          await clearTokens();
          throw new Error('Token refresh failed');
        }
      },
    ],
  },
  retry: {
    limit: 0, // Disable ky's automatic retry - we handle 401 retries manually
    methods: [],
  },
  timeout: 30000, // Add timeout to prevent hanging requests
});

export default apiClient;
