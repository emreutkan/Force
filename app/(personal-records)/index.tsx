import { theme, commonStyles } from '@/constants/theme';
import { usePersonalRecords } from '@/hooks/useExercises';
import type { PersonalRecord } from '@/api/types/exercise';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
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

function fmt1RM(val: number | null): string {
  if (val === null) return '—';
  return `${val.toFixed(1)} kg`;
}

function PRCard({ item }: { item: PersonalRecord }) {
  const color = muscleColor(item.primary_muscle);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(personal-records)/${item.exercise_id}`)}
    >
      <View style={[styles.muscleDot, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.exerciseName} numberOfLines={1}>{item.exercise_name}</Text>
        <Text style={[styles.muscleLabel, { color }]}>{item.primary_muscle.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>
      <View style={styles.cardMetrics}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{fmt1RM(item.best_1rm)}</Text>
          <Text style={styles.metricLabel}>1RM</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{fmt1RM(item.best_weight)}</Text>
          <Text style={styles.metricLabel}>WEIGHT</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export default function PersonalRecordsScreen() {
  const insets = useSafeAreaInsets();
  const { data: records, isLoading, refetch, isRefetching } = usePersonalRecords();

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
        <View style={styles.headerCenter}>
          <Ionicons name="trophy" size={18} color={theme.colors.status.warning} />
          <Text style={styles.headerTitle}>PERSONAL RECORDS</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.text.brand} />
        </View>
      ) : (
        <FlatList
          data={records ?? []}
          keyExtractor={(item) => item.exercise_id.toString()}
          renderItem={({ item }) => <PRCard item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={theme.colors.text.zinc800} />
              <Text style={styles.emptyText}>NO RECORDS YET</Text>
              <Text style={styles.emptySub}>Complete workouts to set your first PRs</Text>
            </View>
          }
        />
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  list: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    gap: theme.spacing.m,
  },
  muscleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  muscleLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.ui.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    marginTop: 6,
    textAlign: 'center',
  },
});
