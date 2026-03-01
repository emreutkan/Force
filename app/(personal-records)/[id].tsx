import { theme, commonStyles } from '@/constants/theme';
import { usePersonalRecordDetail } from '@/hooks/useExercises';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#f87171',
  shoulders: '#fb923c',
  biceps: '#facc15',
  triceps: '#a3e635',
  forearms: '#86efac',
  lats: '#34d399',
  traps: '#22d3ee',
  lower_back: '#38bdf8',
  quads: '#818cf8',
  hamstrings: '#c084fc',
  glutes: '#e879f9',
  calves: '#f472b6',
  abs: '#fb7185',
  obliques: '#f43f5e',
  abductors: '#a78bfa',
  adductors: '#60a5fa',
};

function muscleColor(muscle: string): string {
  return MUSCLE_COLORS[muscle] ?? theme.colors.text.brand;
}

function fmt(val: number | null, unit = 'kg'): string {
  if (val === null) return '—';
  return `${val % 1 === 0 ? val : val.toFixed(1)} ${unit}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PersonalRecordDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Number(id);
  const { data: pr, isLoading } = usePersonalRecordDetail(exerciseId || null);

  const color = pr ? muscleColor(pr.primary_muscle) : theme.colors.text.brand;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pr?.exercise_name ?? 'PERSONAL RECORD'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.text.brand} />
        </View>
      ) : !pr ? (
        <View style={styles.center}>
          <Ionicons name="trophy-outline" size={48} color={theme.colors.text.zinc800} />
          <Text style={styles.emptyText}>NO DATA</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise name + muscle */}
          <View style={styles.heroSection}>
            <View style={[styles.musclePill, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
              <View style={[styles.muscleDot, { backgroundColor: color }]} />
              <Text style={[styles.muscleText, { color }]}>
                {pr.primary_muscle.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.exerciseTitle}>{pr.exercise_name.toUpperCase()}</Text>
            <Text style={styles.totalWorkouts}>{pr.total_workouts} WORKOUTS LOGGED</Text>
          </View>

          {/* 3 PR metrics */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { borderColor: `${color}33` }]}>
              <Ionicons name="trophy" size={20} color={color} style={styles.metricIcon} />
              <Text style={[styles.metricValue, { color }]}>{fmt(pr.best_1rm)}</Text>
              <Text style={styles.metricLabel}>BEST 1RM</Text>
              <Text style={styles.metricDate}>{fmtDate(pr.best_1rm_date)}</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name="barbell" size={20} color={theme.colors.text.secondary} style={styles.metricIcon} />
              <Text style={styles.metricValue}>{fmt(pr.best_weight)}</Text>
              <Text style={styles.metricLabel}>BEST WEIGHT</Text>
              <Text style={styles.metricDate}>{fmtDate(pr.best_weight_date)}</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name="layers" size={20} color={theme.colors.status.success} style={styles.metricIcon} />
              <Text style={styles.metricValue}>{fmt(pr.best_volume_set)}</Text>
              <Text style={styles.metricLabel}>BEST VOL SET</Text>
              <Text style={styles.metricDate}>{fmtDate(pr.best_volume_set_date)}</Text>
            </View>
          </View>

          {/* 1RM History timeline */}
          {pr.pr_history.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>1RM PROGRESSION</Text>
              </View>
              <View style={styles.timelineCard}>
                {pr.pr_history.map((entry, idx) => {
                  const isLast = idx === pr.pr_history.length - 1;
                  const isBest = entry.one_rep_max === pr.best_1rm;
                  return (
                    <View key={entry.workout_id} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, isBest && { backgroundColor: color }]} />
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineTop}>
                          <Text style={[styles.timelineRM, isBest && { color }]}>
                            {entry.one_rep_max.toFixed(1)} kg
                          </Text>
                          {isBest && (
                            <View style={[styles.bestBadge, { backgroundColor: `${color}22` }]}>
                              <Text style={[styles.bestBadgeText, { color }]}>BEST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.timelineWorkout} numberOfLines={1}>{entry.workout_title}</Text>
                        <Text style={styles.timelineDate}>{fmtDate(entry.workout_date)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.primary,
  },
  scroll: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.l,
  },
  musclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: theme.spacing.m,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  muscleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  totalWorkouts: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  metricIcon: {
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  metricDate: {
    fontSize: 8,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginTop: 3,
    textAlign: 'center',
  },

  // Section header
  sectionHeader: {
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 3.6,
  },

  // Timeline
  timelineCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    paddingTop: theme.spacing.m,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.ui.border,
    borderWidth: 2,
    borderColor: theme.colors.text.tertiary,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: theme.colors.ui.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    paddingBottom: theme.spacing.l,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  timelineRM: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  bestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timelineWorkout: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },

  // States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
