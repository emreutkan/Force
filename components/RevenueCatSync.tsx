import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useSettingsStore } from '@/state/userStore';
import { ENTITLEMENT_ID, getCustomerInfo, addCustomerInfoUpdateListener, logInRevenueCat } from '@/services/revenueCat';

/**
 * Runs at app root. Syncs RevenueCat subscription status → isPro store.
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
      if (info) setIsPro(!!info.entitlements.active[ENTITLEMENT_ID]);
    });

    // 2. Real-time: fires immediately after purchase/restore/expiry
    const listener = addCustomerInfoUpdateListener((info) => {
      setIsPro(!!info.entitlements.active[ENTITLEMENT_ID]);
    });

    return () => listener.remove();
  }, [setIsPro]);

  return null;
}
