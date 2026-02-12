import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface KeyMetricsProps {
  best1RM: number;
  progressionPct: number;
}

export default function KeyMetrics({ best1RM, progressionPct }: KeyMetricsProps) {
  return (
    <View style={styles.metricsRow}>
      <View style={[styles.metricCard, { flex: 1.5 }]}>
        <View style={styles.metricHeader}>
          <Ionicons name="trophy-outline" size={14} color={theme.colors.status.warning} />
          <Text style={styles.metricLabel}>PERSONAL BEST</Text>
        </View>
        <View style={styles.metricValueContainer}>
          <Text style={styles.metricValue}>{best1RM.toFixed(1)}</Text>
          <Text style={styles.metricUnit}>KG</Text>
        </View>
      </View>

      <View style={[styles.metricCard, { flex: 1 }]}>
        <View style={styles.metricHeader}>
          <Ionicons
            name={progressionPct >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error}
          />
          <Text style={styles.metricLabel}>PROGRESS</Text>
        </View>
        <View style={styles.metricValueContainer}>
          <Text
            style={[
              styles.metricValue,
              {
                color:
                  progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error,
                fontSize: 24,
              },
            ]}
          >
            {progressionPct >= 0 ? '+' : ''}
            {progressionPct.toFixed(1)}
          </Text>
          <Text
            style={[
              styles.metricUnit,
              {
                color:
                  progressionPct >= 0 ? theme.colors.status.success : theme.colors.status.error,
              },
            ]}
          >
            %
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
