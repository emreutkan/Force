import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ComparisonRow {
  feature: string;
  free: string;
  pro: string;
  isFreePartial?: boolean;
}

const ROWS: ComparisonRow[] = [
  { feature: '1RM history', free: '30 days', pro: 'Full', isFreePartial: true },
  { feature: 'Volume analysis', free: '4 weeks', pro: '12 weeks', isFreePartial: true },
  { feature: 'CNS recovery', free: 'No', pro: 'Yes' },
  { feature: 'Recovery tips', free: 'No', pro: 'Yes' },
  { feature: 'Rest and frequency tips', free: 'No', pro: 'Yes' },
  { feature: 'Training research', free: 'No', pro: 'Yes' },
  { feature: 'Workout insights', free: 'No', pro: 'Yes' },
];

export default function ComparisonTable() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Free vs Pro</Text>
      <Text style={styles.sectionText}>
        Start with the free plan for logging. Upgrade only if you want deeper guidance and longer
        history.
      </Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.featureCol} />
          <View style={styles.valueCol}>
            <Text style={styles.colHeaderFree}>Free</Text>
          </View>
          <View style={styles.valueCol}>
            <Text style={styles.colHeaderPro}>Pro</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {ROWS.map((row, index) => (
          <View
            key={row.feature}
            style={[styles.row, index < ROWS.length - 1 && styles.rowBorder]}
          >
            <View style={styles.featureCol}>
              <Text style={styles.featureName}>{row.feature}</Text>
            </View>
            <View style={styles.valueCol}>
              <Text style={[styles.freeVal, row.isFreePartial && styles.freeValPartial]}>
                {row.free}
              </Text>
            </View>
            <View style={[styles.valueCol, styles.proValCol]}>
              {row.pro === 'Yes' ? (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={theme.colors.status.success}
                />
              ) : (
                <Text style={styles.proVal}>{row.pro}</Text>
              )}
            </View>
          </View>
        ))}
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
    marginBottom: theme.spacing.s,
    marginLeft: 4,
  },
  sectionText: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.m,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  colHeaderFree: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  colHeaderPro: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.status.rest,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 11,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  featureCol: {
    flex: 1,
  },
  valueCol: {
    width: 72,
    alignItems: 'center',
  },
  proValCol: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(192, 132, 252, 0.15)',
    backgroundColor: 'rgba(192, 132, 252, 0.04)',
  },
  featureName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  freeVal: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: theme.colors.text.tertiary,
  },
  freeValPartial: {
    color: theme.colors.status.warning,
    opacity: 0.8,
  },
  proVal: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: theme.colors.status.success,
  },
});
