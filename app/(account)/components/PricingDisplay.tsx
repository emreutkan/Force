import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { getPackageType, getBreakdownText } from '@/utils/packageHelpers';

interface PricingDisplayProps {
  packageInfo?: PurchasesPackage | null;
}

export default function PricingDisplay({ packageInfo }: PricingDisplayProps) {
  if (!packageInfo) {
    return null;
  }

  const packageType = getPackageType(packageInfo);
  const price = packageInfo.product.price;
  const priceString = packageInfo.product.priceString;
  const breakdownText = getBreakdownText(packageType, priceString, price);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.breakdownText}>{breakdownText}</Text>
        <Text style={styles.features}>
          UNLIMITED 1RM • CNS RECOVERY • GLOBAL RANKINGS
        </Text>
      </View>
      <Text style={styles.trust}>Cancel anytime • No long-term commitment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.l,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    width: '100%',
  },
  breakdownText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  features: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  trust: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
