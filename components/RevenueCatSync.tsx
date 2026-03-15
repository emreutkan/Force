import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { logger } from '@/lib/logger';
import { useSettingsStore } from '@/state/userStore';
import {
  ENTITLEMENT_ID,
  addCustomerInfoUpdateListener,
  getCustomerInfo,
  initializeRevenueCat,
  logInRevenueCat,
} from '@/services/revenueCat';

/**
 * Runs at app root. Syncs RevenueCat subscription status -> isPro store.
 * Two triggers: initial fetch on mount + real-time listener for purchases/restores.
 */
export default function RevenueCatSync() {
  const { data: user } = useUser({ enabled: true });
  const setIsPro = useSettingsStore((state) => state.setIsPro);

  // Link RC user ID to backend user so webhooks map correctly
  useEffect(() => {
    if (!user?.id) return;

    void (async () => {
      await initializeRevenueCat();
      await logInRevenueCat(user.id);
    })();
  }, [user?.id]);

  useEffect(() => {
    let isCancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const configured = await initializeRevenueCat();
      if (!configured || isCancelled) return;

      const info = await getCustomerInfo();
      if (info && !isCancelled) {
        const active = info.entitlements.active;
        const isPro = !!active[ENTITLEMENT_ID];
        logger.info('[RC] RevenueCat entitlements synced on mount', {
          entitlementKeys: Object.keys(active),
          isPro,
        });
        setIsPro(isPro);
      }

      const listener = addCustomerInfoUpdateListener((updatedInfo) => {
        const active = updatedInfo.entitlements.active;
        const isPro = !!active[ENTITLEMENT_ID];
        logger.info('[RC] RevenueCat entitlements updated', {
          entitlementKeys: Object.keys(active),
          isPro,
        });
        setIsPro(isPro);
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
  }, [setIsPro]);

  return null;
}
