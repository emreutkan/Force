import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { logger } from '@/lib/logger';
import {
  ENTITLEMENT_ID,
  addCustomerInfoUpdateListener,
  initializeRevenueCat,
  logInRevenueCat,
} from '@/services/revenueCat';

/**
 * Runs at app root. Links RC identity to the backend user and invalidates
 * the ['user'] query when RC emits a subscription change — the backend is
 * the source of truth for is_pro.
 */
export default function RevenueCatSync() {
  const { data: user } = useUser({ enabled: true });
  const queryClient = useQueryClient();

  // Link RC user ID to backend user so webhooks map correctly
  useEffect(() => {
    if (!user?.id) return;

    void (async () => {
      await initializeRevenueCat();
      await logInRevenueCat(user.id);
    })();
  }, [user?.id]);

  // Listen for RC entitlement changes and invalidate the backend user cache
  useEffect(() => {
    let isCancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const configured = await initializeRevenueCat();
      if (!configured || isCancelled) return;

      const listener = addCustomerInfoUpdateListener((updatedInfo) => {
        const active = updatedInfo.entitlements.active;
        logger.info('[RC] RevenueCat entitlements updated — invalidating user cache', {
          entitlementKeys: Object.keys(active),
          isPro: !!active[ENTITLEMENT_ID],
        });
        void queryClient.invalidateQueries({ queryKey: ['user'] });
      });

      removeListener = listener.remove;
      if (isCancelled) {
        removeListener();
      }
    })();

    return () => {
      isCancelled = true;
      removeListener?.();
    };
  }, [queryClient]);

  return null;
}
