import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { logger } from '@/lib/logger';

/* ─── Constants ────────────────────────────────────────────────────── */

/** Must match the entitlement ID configured in the RevenueCat dashboard */
export const ENTITLEMENT_ID = 'pro';

const RC_IOS_KEY = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '';

/* ─── Initialisation ───────────────────────────────────────────────── */

let isConfigured = false;
type RevenueCatGlobalState = typeof globalThis & {
  __forceRevenueCatConfigured__?: boolean;
  __forceRevenueCatConfigurePromise__?: Promise<boolean>;
};

const revenueCatGlobal = globalThis as RevenueCatGlobalState;
const RC_NOT_CONFIGURED_ERROR = 'RevenueCat is not configured';

async function ensureRevenueCatConfigured(): Promise<boolean> {
  if (isConfigured || revenueCatGlobal.__forceRevenueCatConfigured__) {
    isConfigured = true;
    return true;
  }

  if (revenueCatGlobal.__forceRevenueCatConfigurePromise__) {
    return revenueCatGlobal.__forceRevenueCatConfigurePromise__;
  }

  const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;

  if (!apiKey) {
    logger.warn('[RC] RevenueCat API key missing', { platform: Platform.OS });
    return false;
  }

  revenueCatGlobal.__forceRevenueCatConfigurePromise__ = (async () => {
    try {
      const alreadyConfigured = await Purchases.isConfigured().catch(() => false);

      if (!alreadyConfigured) {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        Purchases.configure({ apiKey });
        logger.info('[RC] RevenueCat configured', { platform: Platform.OS });
      } else {
        logger.info('[RC] RevenueCat already configured natively', { platform: Platform.OS });
      }

      isConfigured = true;
      revenueCatGlobal.__forceRevenueCatConfigured__ = true;
      return true;
    } catch (error) {
      revenueCatGlobal.__forceRevenueCatConfigurePromise__ = undefined;
      logger.error('[RC] Failed to initialize RevenueCat', error, { platform: Platform.OS });
      return false;
    }
  })();

  return revenueCatGlobal.__forceRevenueCatConfigurePromise__;
}

/**
 * Call once at app start (before any component mounts).
 * Safe to call multiple times — second+ calls are no-ops.
 */
export function initializeRevenueCat(): Promise<boolean> {
  return ensureRevenueCatConfigured();
}

/* ─── User Identity ────────────────────────────────────────────────── */

/**
 * Links the current device to a backend user so RevenueCat webhooks
 * and cross-platform restore work correctly.
 */
export async function logInRevenueCat(userId: string): Promise<CustomerInfo | null> {
  if (!(await ensureRevenueCatConfigured())) return null;
  try {
    const currentAppUserId = await Purchases.getAppUserID();

    if (currentAppUserId === userId) {
      logger.info('[RC] Skipping RevenueCat login for cached user', { userId });
      return await Purchases.getCustomerInfo();
    }

    const { customerInfo } = await Purchases.logIn(userId);
    logger.info('[RC] RevenueCat login succeeded', { userId });
    return customerInfo;
  } catch (error) {
    logger.error('[RC] RevenueCat login failed', error, { userId });
    return null;
  }
}

/* ─── Customer Info ────────────────────────────────────────────────── */

/**
 * Returns current customer info (entitlements, active subs, etc.).
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!(await ensureRevenueCatConfigured())) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    logger.error('[RC] Failed to fetch RevenueCat customer info', error);
    return null;
  }
}

/**
 * Registers a listener that fires whenever customer info changes
 * (purchase, restore, expiry, etc.).
 * Returns an object with a `remove()` method for cleanup.
 */
export function addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): {
  remove: () => void;
} {
  Purchases.addCustomerInfoUpdateListener(listener);
  return {
    remove: () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    },
  };
}

/* ─── Offerings ────────────────────────────────────────────────────── */

/**
 * Fetches the current offering from RevenueCat.
 * Used by `useOfferings` hook.
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!(await ensureRevenueCatConfigured())) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    logger.error('[RC] Failed to fetch RevenueCat offerings', error);
    throw error; // let react-query handle retries
  }
}

/* ─── Purchases ────────────────────────────────────────────────────── */

/**
 * Initiates a purchase for the given package.
 * Returns `CustomerInfo` on success, `null` if the user cancelled.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!(await ensureRevenueCatConfigured())) {
    throw new Error(RC_NOT_CONFIGURED_ERROR);
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    // User pressed cancel — not a real error
    if (error.userCancelled) return null;
    throw error;
  }
}

/**
 * Restores purchases for the current user (across devices / reinstalls).
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (!(await ensureRevenueCatConfigured())) {
    throw new Error(RC_NOT_CONFIGURED_ERROR);
  }

  return Purchases.restorePurchases();
}

/* ─── Status Helpers ───────────────────────────────────────────────── */

/**
 * Quick boolean check: does the current user have an active "pro" entitlement?
 */
export async function checkProStatus(): Promise<boolean> {
  const info = await getCustomerInfo();
  if (!info) return false;
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

/**
 * Detects the "store not configured" error that occurs in dev builds
 * that haven't been set up with App Store Connect / Google Play Console.
 */
export function isStoreNotConfiguredError(error: any): boolean {
  if (!error) return false;
  const code = error?.code ?? error?.underlyingErrorMessage ?? '';
  const message = error?.message ?? '';
  const combined = `${code} ${message}`.toLowerCase();

  return (
    combined.includes('store_problem') ||
    combined.includes('storefront') ||
    combined.includes('not configured') ||
    combined.includes('no known') ||
    combined.includes('products not found') ||
    combined.includes('billing_unavailable')
  );
}
