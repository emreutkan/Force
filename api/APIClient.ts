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
        request.headers.set('Content-Type', 'application/json');
        request.headers.set('Authorization', `Bearer ${await getAccessToken()}`);
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401 && response.headers.get('error') !== 'TOKEN_NOT_VALID') {
          console.log('Unauthorized, refreshing token');
          const refreshToken = await getRefreshToken();
          if (!refreshToken) {
            console.log('Refresh token not found, clearing tokens');
          }
          try {
            const res: Response = await ky.post(REFRESH_TOKEN_URL, {
              json: { refresh: refreshToken },
            });
            const data: RefreshTokenResponse = await res.json();
            await storeAccessToken(data.access);
            await storeRefreshToken(data.refresh);
            console.log('access token refreshed', data.access);
            console.log('refresh token refreshed', data.refresh);
            request.headers.set('Authorization', `Bearer ${data.access}`); // update request headers
            return ky(request.url, options); // retry request with new token
          } catch (error) {
            console.error('Error refreshing token:', error);
            await clearTokens();
          }
        } else if (response.status === 401 && response.headers.get('error') === 'TOKEN_NOT_VALID') {
          console.log('Token not valid, clearing tokens');
          await clearTokens();
          throw new Error('Token not valid');
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
