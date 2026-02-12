import { theme, typographyStyles } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceHistoryProps {
  recentPerformance: any[];
}

export default function PerformanceHistory({ recentPerformance }: PerformanceHistoryProps) {
  if (recentPerformance.length === 0) return null;

  return (
    <View style={{ marginBottom: 30 }}>
      <Text style={styles.historySectionTitle}>RECENT PERFORMANCE</Text>
      <View style={styles.historyList}>
        {recentPerformance.map((set, idx) => {
          const date = new Date(set.workout_date);
          return (
            <View key={idx} style={styles.historyItem}>
              <View style={styles.historyItemMain}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateDay}>{date.getDate()}</Text>
                  <Text style={styles.dateMonth}>
                    {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle} numberOfLines={1}>
                    {set.workout_title || 'Workout'}
                  </Text>
                  <Text style={styles.workoutYear}>
                    SET {set.set_number} {set.is_warmup ? '• WARMUP' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.historyItemRight}>
                <Text style={styles.historyValue}>{set.weight}</Text>
                <Text style={styles.historyUnit}>KG</Text>
                <Text style={[styles.historyValue, { marginLeft: 8 }]}>×</Text>
                <Text style={[styles.historyValue, { marginLeft: 4 }]}>{set.reps}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historySectionTitle: {
    ...typographyStyles.labelMuted,
    marginBottom: 15,
    marginLeft: 4,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  historyItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dateContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.ui.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    marginTop: -2,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  workoutYear: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
  },
  historyUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
});
