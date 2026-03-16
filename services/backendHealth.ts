import { BACKEND_URL } from '@/api/types';
import { logger } from '@/lib/logger';
import { useBackendStore } from '@/state/stores/backendStore';

const HEALTH_ENDPOINT = `${BACKEND_URL}/health/`;
const HEALTH_TIMEOUT_MS = 5_000;

type HealthResponse = {
  status?: string;
};

export async function checkBackendHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(HEALTH_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as HealthResponse | null;
    const isHealthy = response.ok && data?.status === 'healthy';

    if (isHealthy) {
      useBackendStore.getState().recordSuccess();
      logger.info('[HEALTH] Backend healthy');
      return true;
    }

    useBackendStore.getState().setDown(true);
    logger.warn('[HEALTH] Backend unhealthy', {
      statusCode: response.status,
      healthStatus: data?.status,
    });
    return false;
  } catch (error) {
    useBackendStore.getState().setDown(true);
    logger.warn('[HEALTH] Backend unreachable', error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
