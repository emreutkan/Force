import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import type { NextWorkoutCoachResponse, SessionDecision, ExerciseActionType } from '@/api/types/workout';

interface NextWorkoutCoachCardProps {
  data: NextWorkoutCoachResponse | undefined;
}

const DECISION_CONFIG: Record<
  SessionDecision,
  { color: string; bgColor: string; borderColor: string; icon: React.ComponentProps<typeof Ionicons>['name']; label: string; headline: string }
> = {
  train: {
    color: theme.colors.status.success,
    bgColor: 'rgba(52,211,153,0.04)',
    borderColor: 'rgba(52,211,153,0.15)',
    icon: 'flash',
    label: 'COACH',
    headline: 'READY TO TRAIN',
  },
  train_with_modifications: {
    color: theme.colors.status.warning,
    bgColor: 'rgba(251,146,60,0.04)',
    borderColor: 'rgba(251,146,60,0.15)',
    icon: 'warning-outline',
    label: 'COACH',
    headline: 'TRAIN WITH CHANGES',
  },
  delay_day: {
    color: theme.colors.status.error,
    bgColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.15)',
    icon: 'bed-outline',
    label: 'COACH',
    headline: 'REST RECOMMENDED',
  },
};

const ACTION_COLORS: Record<ExerciseActionType, string> = {
  push: theme.colors.status.success,
  hold: theme.colors.status.active,
  backoff: theme.colors.status.warning,
  skip: theme.colors.status.error,
  swap: theme.colors.status.warning,
};

export default function NextWorkoutCoachCard({ data }: NextWorkoutCoachCardProps) {
  if (!data) return null;

  const config = DECISION_CONFIG[data.session_decision];
  const topFindings = data.findings
    .filter((f) => f.severity === 'error' || f.severity === 'warning')
    .slice(0, 2);
  const topActions = data.exercise_actions.slice(0, 2);

  return (
    <View style={[styles.card, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      <View style={styles.inner}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.sectionLabel, { color: config.color }]}>{config.label}</Text>
          </View>
          <View style={[styles.decisionBadge, { backgroundColor: `${config.color}18`, borderColor: `${config.color}40` }]}>
            <Text style={[styles.decisionBadgeText, { color: config.color }]}>{config.headline}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        {data.session_decision === 'train' && topFindings.length === 0 && topActions.length === 0 ? (
          <View style={styles.readyRow}>
            <View style={[styles.readyIconWrap, { backgroundColor: `${config.color}15`, borderColor: `${config.color}30` }]}>
              <Ionicons name="checkmark-circle" size={20} color={config.color} />
            </View>
            <View>
              <Text style={[styles.readyTitle, { color: config.color }]}>ALL SYSTEMS GO</Text>
              <Text style={styles.readySubtitle}>Recovery optimal — give it everything</Text>
            </View>
          </View>
        ) : (
          <View style={styles.itemList}>
            {topFindings.map((finding, i) => (
              <View key={i} style={styles.itemRow}>
                <Ionicons
                  name={finding.severity === 'error' ? 'alert-circle' : 'warning'}
                  size={12}
                  color={finding.severity === 'error' ? theme.colors.status.error : theme.colors.status.warning}
                />
                <Text style={styles.itemText} numberOfLines={2}>
                  {finding.message}
                </Text>
              </View>
            ))}
            {topActions.map((action, i) => (
              <View key={`action-${i}`} style={styles.itemRow}>
                <View style={[styles.actionBadge, { backgroundColor: `${ACTION_COLORS[action.action]}20`, borderColor: `${ACTION_COLORS[action.action]}40` }]}>
                  <Text style={[styles.actionBadgeText, { color: ACTION_COLORS[action.action] }]}>
                    {action.action.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.itemText} numberOfLines={1}>
                  {action.exercise.name}
                  {action.swap_exercise ? ` → ${action.swap_exercise.name}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.xxl,
    paddingLeft: theme.spacing.l,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.s,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
  },
  decisionBadge: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  decisionBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
    marginVertical: theme.spacing.m,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  readyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  readySubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  itemList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  itemText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  actionBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
