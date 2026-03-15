import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useCurrentProgramDay, useStartTodayWorkout } from '@/hooks/useWorkoutProgram';
import type { StartTodayError } from '@/api/WorkoutProgram';

const MAX_EXERCISES_SHOWN = 3;

export default function TodayProgramCard() {
  const { data, isLoading } = useCurrentProgramDay();
  const startToday = useStartTodayWorkout();

  // No active program — don't render anything
  if (isLoading || !data) return null;

  const { program_id, program_name, cycle_length, current_day_number, current_day } = data;
  const isRestDay = current_day.is_rest_day;
  const exercises = current_day.exercises.slice().sort((a, b) => a.order - b.order);
  const visibleExercises = exercises.slice(0, MAX_EXERCISES_SHOWN);
  const overflowCount = exercises.length - MAX_EXERCISES_SHOWN;

  const handleStartToday = () => {
    startToday.mutate(undefined, {
      onSuccess: () => {
        router.push('/(active-workout)');
      },
      onError: (err) => {
        const typedErr = err as Error & { startTodayError?: StartTodayError };
        if (typedErr.startTodayError?.code === 'ACTIVE_WORKOUT_EXISTS') {
          // An active workout already exists — navigate to it
          router.push('/(active-workout)');
        }
        // NO_ACTIVE_PROGRAM and UNKNOWN silently fail (shouldn't happen here)
      },
    });
  };

  return (
    <View
      style={[styles.card, isRestDay && styles.cardRest]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, isRestDay && styles.accentBarRest]} />

      <View style={styles.inner}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <Ionicons
              name={isRestDay ? 'moon-outline' : 'calendar-outline'}
              size={12}
              color={isRestDay ? theme.colors.status.rest : theme.colors.status.active}
            />
            <Text style={[styles.sectionLabel, isRestDay && styles.sectionLabelRest]}>
              TODAY'S PROGRAM
            </Text>
          </View>
          <View style={[styles.dayBadge, isRestDay && styles.dayBadgeRest]}>
            <Text style={[styles.dayBadgeText, isRestDay && styles.dayBadgeTextRest]}>
              DAY {current_day_number}/{cycle_length}
            </Text>
          </View>
        </View>

        {/* Program name */}
        <Text style={styles.programName}>{program_name.toUpperCase()}</Text>

        {/* Day name */}
        <Text style={[styles.dayName, isRestDay && styles.dayNameRest]}>
          {current_day.name.toUpperCase()}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        {isRestDay ? (
          <View style={styles.restContent}>
            <View style={styles.restIconWrap}>
              <Ionicons name="moon" size={20} color={theme.colors.status.rest} />
            </View>
            <View>
              <Text style={styles.restTitle}>REST & RECOVERY</Text>
              <Text style={styles.restSubtitle}>No training today — recharge</Text>
            </View>
          </View>
        ) : exercises.length > 0 ? (
          <View style={styles.exerciseList}>
            {visibleExercises.map((ex, idx) => (
              <View key={ex.id} style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex.exercise.name.toUpperCase()}
                </Text>
                <View style={styles.setsChip}>
                  <Text style={styles.setsChipText}>{ex.target_sets}</Text>
                  <Text style={styles.setsChipLabel}>×</Text>
                </View>
              </View>
            ))}
            {overflowCount > 0 && (
              <Text style={styles.overflowText}>+{overflowCount} more exercise{overflowCount !== 1 ? 's' : ''}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No exercises configured</Text>
        )}

        {/* Footer CTAs */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.viewProgramBtn,
              pressed && { opacity: 0.6 }
            ]}
            onPress={() => router.push(`/(workout-program)/${program_id}`)}
          >
            <Text style={[styles.footerText, isRestDay && styles.footerTextRest]}>
              VIEW PROGRAM
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={isRestDay ? theme.colors.status.rest : theme.colors.status.active}
            />
          </Pressable>

          {!isRestDay && (
            <Pressable
              style={({ pressed }) => [
                styles.startTodayBtn,
                startToday.isPending && styles.startTodayBtnDisabled,
                pressed && !startToday.isPending && styles.startTodayBtnPressed
              ]}
              onPress={handleStartToday}
              disabled={startToday.isPending}
            >
              {startToday.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
              ) : (
                <>
                  <Ionicons name="flash" size={12} color={theme.colors.text.primary} />
                  <Text style={styles.startTodayText}>START</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
  },
  cardRest: {
    backgroundColor: 'rgba(192, 132, 252, 0.03)',
    borderColor: 'rgba(192, 132, 252, 0.1)',
  },
  accentBar: {
    width: 3,
    backgroundColor: theme.colors.status.active,
  },
  accentBarRest: {
    backgroundColor: theme.colors.status.rest,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.xl,
    paddingLeft: theme.spacing.m,
  },

  // Header
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
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.status.active,
  },
  sectionLabelRest: {
    color: theme.colors.status.rest,
  },
  dayBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dayBadgeRest: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
  },
  dayBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  dayBadgeTextRest: {
    color: theme.colors.status.rest,
  },

  // Titles
  programName: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dayName: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  dayNameRest: {
    color: theme.colors.status.rest,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
    marginVertical: theme.spacing.m,
    opacity: 0.5,
  },

  // Exercise list
  exerciseList: {
    gap: 6,
    marginBottom: theme.spacing.m,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.status.active,
    opacity: 0.6,
  },
  exerciseName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.1,
  },
  setsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  setsChipText: {
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  setsChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  overflowText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 1,
    marginLeft: 14,
  },
  emptyText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.m,
  },

  // Rest content
  restContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.m,
  },
  restIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.rest,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  restSubtitle: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s,
  },
  viewProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footerTextRest: {
    color: theme.colors.status.rest,
  },
  startTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 70,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startTodayBtnPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: theme.colors.status.active,
    opacity: 0.9,
  },
  startTodayBtnDisabled: {
    opacity: 0.6,
  },
  startTodayText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
