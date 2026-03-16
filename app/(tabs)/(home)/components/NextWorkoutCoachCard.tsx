import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, typographyStyles } from '@/constants/theme';
import type {
  NextWorkoutCoachResponse,
  SessionDecision,
  ExerciseActionType,
} from '@/api/types/workout';

interface NextWorkoutCoachCardProps {
  data: NextWorkoutCoachResponse | undefined;
}

const DECISION_CONFIG: Record<
  SessionDecision,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    headline: string;
  }
> = {
  train: {
    color: theme.colors.status.success,
    bgColor: 'rgba(52, 211, 153, 0.03)',
    borderColor: 'rgba(52, 211, 153, 0.1)',
    icon: 'flash',
    label: 'COACH',
    headline: 'TRAIN AS PLANNED',
  },
  train_with_modifications: {
    color: theme.colors.status.warning,
    bgColor: 'rgba(255, 159, 10, 0.03)',
    borderColor: 'rgba(255, 159, 10, 0.1)',
    icon: 'warning-outline',
    label: 'COACH',
    headline: "ADJUST TODAY'S WORKOUT",
  },
  delay_day: {
    color: theme.colors.status.error,
    bgColor: 'rgba(255, 69, 58, 0.03)',
    borderColor: 'rgba(255, 69, 58, 0.1)',
    icon: 'bed-outline',
    label: 'COACH',
    headline: 'TAKE A REST DAY',
  },
};

const ACTION_COLORS: Record<ExerciseActionType, string> = {
  push: theme.colors.status.success,
  hold: theme.colors.status.active,
  backoff: theme.colors.status.warning,
  skip: theme.colors.status.error,
  swap: theme.colors.status.warning,
};

const NextWorkoutCoachCard = React.memo(function NextWorkoutCoachCard({ data }: NextWorkoutCoachCardProps) {
  const config = data ? DECISION_CONFIG[data.session_decision] : null;
  const topFindings = useMemo(
    () => data?.findings.filter((f) => f.severity === 'error' || f.severity === 'warning').slice(0, 2) ?? [],
    [data?.findings],
  );
  const topActions = useMemo(() => data?.exercise_actions.slice(0, 2) ?? [], [data?.exercise_actions]);

  if (!data || !config) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}
    >
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[typographyStyles.label, { color: config.color, fontSize: 10 }]}>
              {config.label}
            </Text>
          </View>
          <View
            style={[
              styles.decisionBadge,
              { backgroundColor: `${config.color}15`, borderColor: `${config.color}25` },
            ]}
          >
            <Text style={[styles.decisionBadgeText, { color: config.color }]}>
              {config.headline}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {data.session_decision === 'train' &&
        topFindings.length === 0 &&
        topActions.length === 0 ? (
          <View style={styles.readyRow}>
            <View
              style={[
                styles.readyIconWrap,
                {
                  backgroundColor: `${config.color}10`,
                  borderColor: `${config.color}20`,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color={config.color} />
            </View>
            <View>
              <Text style={[styles.readyTitle, { color: config.color }]}>READY</Text>
              <Text style={styles.readySubtitle}>Recovery looks good for today</Text>
            </View>
          </View>
        ) : (
          <View style={styles.itemList}>
            {topFindings.map((finding, i) => (
              <View key={`finding-${finding.code ?? 'unknown'}-${i}`} style={styles.itemRow}>
                <Ionicons
                  name={finding.severity === 'error' ? 'alert-circle' : 'warning'}
                  size={12}
                  color={
                    finding.severity === 'error'
                      ? theme.colors.status.error
                      : theme.colors.status.warning
                  }
                  style={styles.itemIcon}
                />
                <Text style={styles.itemText} numberOfLines={2}>
                  {finding.message}
                </Text>
              </View>
            ))}
            {topActions.map((action, i) => (
              <View
                key={`action-${action.exercise_id}-${action.action}-${i}`}
                style={styles.itemRow}
              >
                <View
                  style={[
                    styles.actionBadge,
                    {
                      backgroundColor: `${ACTION_COLORS[action.action]}15`,
                      borderColor: `${ACTION_COLORS[action.action]}25`,
                    },
                  ]}
                >
                  <Text
                    style={[styles.actionBadgeText, { color: ACTION_COLORS[action.action] }]}
                  >
                    {action.action.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.itemText} numberOfLines={1}>
                  {action.exercise.name}
                  {action.swap_exercise ? ` -> ${action.swap_exercise.name}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

export default NextWorkoutCoachCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.xl,
    paddingLeft: theme.spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decisionBadge: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  decisionBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
    marginVertical: theme.spacing.m,
    opacity: 0.5,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  readyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  readySubtitle: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  itemList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingVertical: 2,
  },
  itemIcon: {
    marginTop: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  actionBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  actionBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
