import ky from 'ky';
import { supabase } from '../lib/supabase';
import { BACKEND_URL } from './types';
import { useBackendStore } from '@/state/stores/backendStore';
import { logger } from '@/lib/logger';

const GET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type GetCacheEntry = {
  body: string;
  etag?: string;
  lastModified?: string;
  timestamp: number;
};

const getCache = new Map<string, GetCacheEntry>();
const MAX_CACHE_ENTRIES = 100;

function setCacheEntry(key: string, entry: GetCacheEntry): void {
  // Evict the oldest entry before adding so size never exceeds MAX_CACHE_ENTRIES
  if (getCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = getCache.keys().next().value;
    if (firstKey !== undefined) getCache.delete(firstKey);
  }
  getCache.set(key, entry);
}

function getCacheKey(request: Request): string {
  return request.url;
}

function isGetCacheFresh(entry: GetCacheEntry): boolean {
  return Date.now() - entry.timestamp < GET_CACHE_TTL_MS;
}

const apiClient = ky.create({
  prefixUrl: BACKEND_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        request.headers.set('Content-Type', 'application/json');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        // For GET: add conditional headers so server can return 304 when unchanged
        if (request.method === 'GET') {
          const key = getCacheKey(request);
          const entry = getCache.get(key);
          if (entry && isGetCacheFresh(entry)) {
            if (entry.etag) request.headers.set('If-None-Match', entry.etag);
            if (entry.lastModified) request.headers.set('If-Modified-Since', entry.lastModified);
          }
        }

        logger.debug('[API] Request', {
          method: request.method,
          url: request.url,
        });
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        logger.debug('[API] Response', {
          status: response.status,
          method: request.method,
          url: request.url,
        });

        // Record failures without logging raw response bodies in production.
        if (response.status >= 400) {
          const bodyText = await response.clone().text().catch(() => '');
          const isHtmlResponse = bodyText.includes('<!');

          if (response.status >= 500 || isHtmlResponse) {
            logger.error('[API] Backend request failed', undefined, {
              status: response.status,
              method: request.method,
              url: request.url,
              isHtmlResponse,
            });
            useBackendStore.getState().recordFailure();
          } else {
            logger.warn('[API] Request returned a client error', {
              status: response.status,
              method: request.method,
              url: request.url,
            });
          }
        } else {
          useBackendStore.getState().recordSuccess();
        }

        // GET 304 Not Modified → use cached body and return as 200
        if (request.method === 'GET' && response.status === 304) {
          const key = getCacheKey(request);
          const entry = getCache.get(key);
          if (entry) {
            return new Response(entry.body, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        // GET 200 → store body and cache headers for future 304
        if (request.method === 'GET' && response.status === 200) {
          const key = getCacheKey(request);
          const clone = response.clone();
          const body = await clone.text();
          setCacheEntry(key, {
            body,
            etag: response.headers.get('ETag') ?? undefined,
            lastModified: response.headers.get('Last-Modified') ?? undefined,
            timestamp: Date.now(),
          });
        }

        // 401: try to refresh Supabase session and retry
        if (response.status === 401) {
          const { data, error } = await supabase.auth.refreshSession();
          if (!error && data.session) {
            const { prefixUrl, hooks, ...retryOptions } = options as any;
            return ky(request.url, {
              ...retryOptions,
              headers: {
                ...retryOptions.headers,
                Authorization: `Bearer ${data.session.access_token}`,
              },
              retry: { limit: 0, methods: [] },
            });
          }
        }

        return response;
      },
    ],
  },
  retry: {
    limit: 0,
    methods: [],
  },
  timeout: 30000,
});

/** Clears the in-memory GET cache for all URLs (or a specific URL). */
export function clearGetCache(url?: string): void {
  if (url) {
    getCache.delete(url);
  } else {
    getCache.clear();
  }
}

export default apiClient;
