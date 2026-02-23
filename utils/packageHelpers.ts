import type { PurchasesPackage } from 'react-native-purchases';

export type PackageType = 'weekly' | 'monthly' | 'yearly' | 'lifetime';

/**
 * Determine package type from identifier
 * More robust detection to handle various naming conventions
 */
export const getPackageType = (pkg: PurchasesPackage): PackageType => {
  const id = pkg.identifier.toLowerCase();

  // Check for lifetime patterns
  if (id === '$rc_lifetime' || id.includes('lifetime') || id.includes('forever')) {
    return 'lifetime';
  }

  // Check for weekly patterns
  if (id === '$rc_weekly' || id.includes('week')) {
    return 'weekly';
  }

  // Check for yearly/annual patterns
  if (id === '$rc_annual' || id.includes('annual') || id.includes('year')) {
    return 'yearly';
  }

  // Check for monthly patterns
  if (id === '$rc_monthly' || id.includes('month')) {
    return 'monthly';
  }

  // Fallback
  console.warn(`Could not determine package type for identifier: ${id}, defaulting to monthly`);
  return 'monthly';
};

/**
 * Get display label for package type
 */
export const getPackageLabel = (type: PackageType): string => {
  switch (type) {
    case 'weekly':
      return 'WEEKLY';
    case 'monthly':
      return 'MONTHLY';
    case 'yearly':
      return 'YEARLY';
    case 'lifetime':
      return 'LIFETIME';
  }
};

/**
 * Get period suffix for package type
 */
export const getPackagePeriod = (type: PackageType): string => {
  switch (type) {
    case 'weekly':
      return '/wk';
    case 'monthly':
      return '/mo';
    case 'yearly':
      return '/yr';
    case 'lifetime':
      return 'FOREVER';
  }
};

/**
 * Calculate savings percentage vs monthly
 * Shows for yearly and lifetime packages
 */
export const calculateSavings = (
  packages: PurchasesPackage[],
  currentPkg: PurchasesPackage
): number | null => {
  const currentType = getPackageType(currentPkg);

  // Find monthly package for comparison
  const monthlyPkg = packages.find((p) => getPackageType(p) === 'monthly');
  if (!monthlyPkg) return null;

  const monthlyPrice = monthlyPkg.product.price;
  const currentPrice = currentPkg.product.price;

  // Calculate savings for yearly
  if (currentType === 'yearly') {
    const yearlyMonthlyEquivalent = monthlyPrice * 12;
    const savings = ((yearlyMonthlyEquivalent - currentPrice) / yearlyMonthlyEquivalent) * 100;
    return Math.round(savings);
  }

  // Calculate savings for lifetime (assume 2 years = 24 months)
  if (currentType === 'lifetime') {
    const lifetimeMonthlyEquivalent = monthlyPrice * 24; // 2 years
    const savings = ((lifetimeMonthlyEquivalent - currentPrice) / lifetimeMonthlyEquivalent) * 100;
    return Math.round(savings);
  }

  return null;
};

/**
 * Get breakdown text for pricing display
 */
export const getBreakdownText = (
  packageType: PackageType,
  priceString: string,
  price: number
): string => {
  // Extract currency symbol from price string (e.g., "$4.99" -> "$")
  const currency = priceString.replace(/[\d.,]/g, '').trim() || '$';

  switch (packageType) {
    case 'weekly':
      const perDay = (price / 7).toFixed(2);
      return `${currency}${perDay} per day • Flexible weekly plan`;
    case 'monthly':
      const perDayMonthly = (price / 30).toFixed(2);
      return `${currency}${perDayMonthly} per day • Less than a protein shake`;
    case 'yearly':
      const perMonth = (price / 12).toFixed(2);
      const perDayYearly = (price / 365).toFixed(2);
      return `${currency}${perMonth}/mo • ${currency}${perDayYearly}/day • Best value`;
    case 'lifetime':
      return `One-time payment • Unlock everything forever • No subscriptions`;
  }
};

/**
 * Sort packages in display order: weekly, monthly, yearly, lifetime
 */
export const sortPackages = (packages: PurchasesPackage[]): PurchasesPackage[] => {
  const typeOrder = { weekly: 0, monthly: 1, yearly: 2, lifetime: 3 };
  return [...packages].sort((a, b) => {
    return typeOrder[getPackageType(a)] - typeOrder[getPackageType(b)];
  });
};
