import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface OneRMHistoryProps {
  history: any[];
  best1RM: number;
}

export default function OneRMHistory({ history, best1RM }: OneRMHistoryProps) {
  return (
    <View>
      <Text style={styles.historySectionTitle}>1RM HISTORY</Text>
      <View style={styles.historyList}>
        {history.map((entry, idx) => {
          const date = new Date(entry.workout_date);
          const isNewBest = entry.one_rep_max >= best1RM && idx < 3;

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
                    {entry.workout_title}
                  </Text>
                  <View style={styles.bestBadgeContainer}>
                    {isNewBest && (
                      <View style={styles.bestBadge}>
                        <Ionicons name="star" size={10} color="#000" />
                        <Text style={styles.bestBadgeText}>PB</Text>
                      </View>
                    )}
                    <Text style={styles.workoutYear}>{date.getFullYear()}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.historyItemRight}>
                <Text style={styles.historyValue}>{entry.one_rep_max.toFixed(1)}</Text>
                <Text style={styles.historyUnit}>KG</Text>
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
  bestBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
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
