import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { logger } from '@/lib/logger';
import { useSettingsStore } from '@/state/userStore';
import {
  ENTITLEMENT_ID,
  addCustomerInfoUpdateListener,
  getCustomerInfo,
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
    if (user?.id) {
      logInRevenueCat(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // 1. Check current status on mount
    getCustomerInfo().then((info) => {
      if (info) {
        const active = info.entitlements.active;
        const isPro = !!active[ENTITLEMENT_ID];
        logger.info('[RC] RevenueCat entitlements synced on mount', {
          entitlementKeys: Object.keys(active),
          isPro,
        });
        setIsPro(isPro);
      }
    });

    // 2. Real-time: fires immediately after purchase/restore/expiry
    const listener = addCustomerInfoUpdateListener((info) => {
      const active = info.entitlements.active;
      const isPro = !!active[ENTITLEMENT_ID];
      logger.info('[RC] RevenueCat entitlements updated', {
        entitlementKeys: Object.keys(active),
        isPro,
      });
      setIsPro(isPro);
    });

    return () => listener.remove();
  }, [setIsPro]);

  return null;
}
