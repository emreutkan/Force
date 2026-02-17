import Constants from 'expo-constants';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY =
  (Constants.expoConfig?.extra as { RC_API_KEY?: string } | undefined)?.RC_API_KEY ??
  Platform.select({
    ios: 'appl_REPLACE_WITH_YOUR_IOS_KEY',
    android: 'goog_REPLACE_WITH_YOUR_ANDROID_KEY',
  });

export const ENTITLEMENT_ID = 'entl1f71d85a8d';

export const initializeRevenueCat = async (userId?: string) => {
  if (!REVENUECAT_API_KEY) return;
  try {
    Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
  } catch (error) {
    // silent in prod
  }
};

export const logInRevenueCat = async (backendUserId: string): Promise<void> => {
  try {
    await Purchases.logIn(backendUserId);
  } catch {
    // silent in prod
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current;
    }
    return null;
  } catch {
    return null;
  }
};

export function isStoreNotConfiguredError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  const lower = msg.toLowerCase();
  if (lower.includes('not available') || lower.includes('unavailable')) return true;
  if (lower.includes('cannot connect') || lower.includes('could not connect')) return true;
  if (lower.includes('product') && (lower.includes('find') || lower.includes('invalid'))) return true;
  if (lower.includes('store') && (lower.includes('configuration') || lower.includes('not configured'))) return true;
  return false;
}

export const purchasePackage = async (
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) throw error;
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
};

export const checkProStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
};

export const addCustomerInfoUpdateListener = (callback: (customerInfo: CustomerInfo) => void) => {
  return Purchases.addCustomerInfoUpdateListener(callback);
};
