import { theme } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { getPackageType, getPackageLabel, sortPackages } from '@/utils/packageHelpers';
import { Ionicons } from '@expo/vector-icons';

interface PackageComparisonProps {
  packages: PurchasesPackage[];
}

/**
 * Optional component showing side-by-side package comparison
 * Use this if you want a comparison table instead of/in addition to the selector
 */
export default function PackageComparison({ packages }: PackageComparisonProps) {
  if (packages.length === 0) return null;

  const sortedPackages = sortPackages(packages);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>COMPARE PLANS</Text>

      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>PLAN</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>PRICE</Text>
          </View>
          <View style={styles.headerCell}>
            <Text style={styles.headerText}>PER DAY</Text>
          </View>
        </View>

        {/* Package Rows */}
        {sortedPackages.map((pkg, index) => {
          const packageType = getPackageType(pkg);
          const price = pkg.product.price;
          const priceString = pkg.product.priceString;
          const currency = priceString.replace(/[\d.,]/g, '').trim() || '$';
          const daysInPeriod = packageType === 'weekly' ? 7 : packageType === 'monthly' ? 30 : 365;
          const perDay = (price / daysInPeriod).toFixed(2);

          return (
            <View
              key={pkg.identifier}
              style={[
                styles.row,
                index === sortedPackages.length - 1 && styles.rowLast,
              ]}
            >
              <View style={styles.cell}>
                <Text style={styles.planName}>{getPackageLabel(packageType)}</Text>
                {packageType === 'yearly' && (
                  <View style={styles.bestValueBadge}>
                    <Ionicons name="star" size={10} color={theme.colors.status.warning} />
                    <Text style={styles.bestValueText}>BEST VALUE</Text>
                  </View>
                )}
              </View>
              <View style={styles.cell}>
                <Text style={styles.priceText}>
                  {currency}
                  {price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.perDayText}>
                  {currency}
                  {perDay}
                </Text>
              </View>
            </View>
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
  table: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  headerCell: {
    flex: 1,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: theme.colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    flex: 1,
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.primary,
  },
  bestValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderRadius: theme.borderRadius.m,
  },
  bestValueText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.status.warning,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  perDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
});
