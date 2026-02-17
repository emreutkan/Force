import { theme } from '@/constants/theme';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import {
  getPackageType,
  getPackageLabel,
  getPackagePeriod,
  calculateSavings,
  sortPackages,
} from '@/utils/packageHelpers';

interface PackageSelectorProps {
  packages: PurchasesPackage[];
  selectedPackage: PurchasesPackage;
  onSelectPackage: (pkg: PurchasesPackage) => void;
}

export default function PackageSelector({
  packages,
  selectedPackage,
  onSelectPackage,
}: PackageSelectorProps) {
  const sortedPackages = sortPackages(packages);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>SELECT PLAN</Text>
      <View style={styles.packagesRow}>
        {sortedPackages.map((pkg) => {
          const isSelected = pkg.identifier === selectedPackage.identifier;
          const packageType = getPackageType(pkg);
          const savings = calculateSavings(packages, pkg);

          // Use actual price values from RevenueCat
          const priceString = pkg.product.priceString; // e.g., "$4.99"
          const price = pkg.product.price; // e.g., 4.99

          // Extract currency symbol (everything that's not a digit/decimal)
          const currencyMatch = priceString.match(/[^\d.,\s]+/);
          const currency = currencyMatch ? currencyMatch[0] : '$';

          return (
            <Pressable
              key={pkg.identifier}
              style={[
                styles.packageCard,
                isSelected && styles.packageCardSelected,
                packageType === 'lifetime' && styles.lifetimeCard,
              ]}
              onPress={() => onSelectPackage(pkg)}
            >
              {/* Best value badge for lifetime */}
              {packageType === 'lifetime' && (
                <View style={styles.bestValueBadge}>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}

              {/* Savings badge for yearly/lifetime */}
              {savings && savings > 0 && packageType !== 'lifetime' && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>SAVE {savings}%</Text>
                </View>
              )}

              {/* Package label */}
              <Text style={[
                styles.packageLabel,
                packageType === 'lifetime' && styles.lifetimeLabel,
              ]}>
                {getPackageLabel(packageType)}
              </Text>

              {/* Price - show full price with decimals */}
              <View style={styles.priceRow}>
                <Text style={[
                  styles.price,
                  packageType === 'lifetime' && styles.lifetimePrice,
                ]}>
                  {priceString}
                </Text>
              </View>

              {/* Period */}
              <Text style={[
                styles.period,
                packageType === 'lifetime' && styles.lifetimePeriod,
              ]}>
                {getPackagePeriod(packageType)}
              </Text>

              {/* Selected indicator */}
              {isSelected && (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={
                    packageType === 'lifetime' ? '#FFD700' : theme.colors.status.rest
                  } />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    marginLeft: 4,
  },
  packagesRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  packageCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  packageCardSelected: {
    borderColor: theme.colors.status.rest,
    borderWidth: 2,
    backgroundColor: 'rgba(192, 132, 252, 0.05)',
  },
  lifetimeCard: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: theme.colors.status.warning,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.colors.background,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FFD700',
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.colors.background,
  },
  packageLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.s,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  period: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  lifetimeLabel: {
    color: '#FFD700',
  },
  lifetimePrice: {
    color: '#FFD700',
  },
  lifetimePeriod: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  selectedCheck: {
    position: 'absolute',
    top: theme.spacing.s,
    right: theme.spacing.s,
  },
});
