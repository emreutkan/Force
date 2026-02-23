import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import {
  useProgram,
  useActivateProgram,
  useDeactivateProgram,
  useDeleteProgram,
  useRenameProgram,
} from '@/hooks/useWorkoutProgram';
import type { WorkoutProgramDay } from '@/api/types/program';
import { Platform } from 'react-native';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const insets = useSafeAreaInsets();
  const [overflowOpen, setOverflowOpen] = useState(false);

  const { data: program, isLoading, isError } = useProgram(programId);
  const activateProgram = useActivateProgram();
  const deactivateProgram = useDeactivateProgram();
  const deleteProgram = useDeleteProgram();
  const renameProgram = useRenameProgram();

  const handleActivate = async () => {
    try {
      await activateProgram.mutateAsync(programId);
    } catch {
      Alert.alert('Error', 'Failed to activate program.');
    }
  };

  const handleDeactivate = async () => {
    Alert.alert('Deactivate Program', 'This will deactivate the program without replacing it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateProgram.mutateAsync(programId);
            setOverflowOpen(false);
          } catch {
            Alert.alert('Error', 'Failed to deactivate program.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Program', `Delete "${program?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProgram.mutateAsync(programId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete program.');
          }
        },
      },
    ]);
  };

  const handleRename = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Program',
        'Enter a new name:',
        async (newName) => {
          if (!newName?.trim()) return;
          try {
            await renameProgram.mutateAsync({ id: programId, request: { name: newName.trim() } });
          } catch {
            Alert.alert('Error', 'Failed to rename program.');
          }
        },
        'plain-text',
        program?.name ?? ''
      );
    } else {
      Alert.alert('Rename', 'Renaming is only available on iOS.', [{ text: 'OK' }]);
    }
    setOverflowOpen(false);
  };

  const renderDay = (day: WorkoutProgramDay) => (
    <View key={day.id} style={[styles.dayCard, day.is_rest_day && styles.dayCardRest]}>
      {/* Day accent bar */}
      <View style={[styles.dayAccent, day.is_rest_day && styles.dayAccentRest]} />

      <View style={styles.dayInner}>
        {/* Day header */}
        <View style={styles.dayHeader}>
          <View style={[styles.dayNumberCircle, day.is_rest_day && styles.dayNumberCircleRest]}>
            <Text style={[styles.dayNumberText, day.is_rest_day && styles.dayNumberTextRest]}>
              {day.day_number}
            </Text>
          </View>
          <View style={styles.dayTitleBlock}>
            <Text style={[styles.dayName, day.is_rest_day && styles.dayNameRest]} numberOfLines={1}>
              {day.name.toUpperCase()}
            </Text>
            <View style={styles.dayTypePill}>
              <Ionicons
                name={day.is_rest_day ? 'moon-outline' : 'barbell-outline'}
                size={10}
                color={day.is_rest_day ? theme.colors.status.rest : theme.colors.status.active}
              />
              <Text style={[styles.dayTypeText, day.is_rest_day && styles.dayTypeTextRest]}>
                {day.is_rest_day ? 'REST' : `${day.exercises.length} EXERCISE${day.exercises.length !== 1 ? 'S' : ''}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Exercises */}
        {!day.is_rest_day && day.exercises.length > 0 && (
          <View style={styles.exerciseList}>
            {day.exercises
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((ex, idx) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndexBadge}>
                    <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {ex.exercise.name.toUpperCase()}
                  </Text>
                  <View style={styles.setsChip}>
                    <Text style={styles.setsChipText}>{ex.target_sets}</Text>
                    <Text style={styles.setsChipLabel}>SETS</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {day.is_rest_day && (
          <Text style={styles.restNote}>Recovery & regeneration</Text>
        )}

        {!day.is_rest_day && day.exercises.length === 0 && (
          <Text style={styles.restNote}>No exercises added</Text>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(99,101,241,0.13)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={theme.colors.status.active} />
      </View>
    );
  }

  if (isError || !program) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(99,101,241,0.13)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.status.error} />
        </View>
        <Text style={styles.errorText}>Program not found</Text>
        <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  const restDayCount = program.days.filter((d) => d.is_rest_day).length;
  const workDayCount = program.days.length - restDayCount;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99,101,241,0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {program.name.toUpperCase()}
          </Text>
          <Text style={styles.headerSub}>{program.cycle_length}-DAY CYCLE</Text>
        </View>
        <View style={styles.headerRight}>
          {program.is_active ? (
            <View style={styles.activePill}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.status.active} />
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          ) : (
            <Pressable
              style={styles.activateBtn}
              onPress={handleActivate}
              disabled={activateProgram.isPending}
            >
              {activateProgram.isPending ? (
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
              ) : (
                <Text style={styles.activateBtnText}>ACTIVATE</Text>
              )}
            </Pressable>
          )}
          <Pressable style={styles.overflowBtn} onPress={() => setOverflowOpen(!overflowOpen)}>
            <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Overflow dropdown */}
      {overflowOpen && (
        <View style={styles.overflowMenu}>
          <Pressable style={styles.overflowItem} onPress={handleRename}>
            <Ionicons name="pencil-outline" size={16} color={theme.colors.text.primary} />
            <Text style={styles.overflowItemText}>Rename</Text>
          </Pressable>
          {program.is_active && (
            <Pressable style={styles.overflowItem} onPress={handleDeactivate}>
              <Ionicons name="pause-circle-outline" size={16} color={theme.colors.status.warning} />
              <Text style={[styles.overflowItemText, { color: theme.colors.status.warning }]}>
                Deactivate
              </Text>
            </Pressable>
          )}
          <View style={styles.overflowDivider} />
          <Pressable
            style={styles.overflowItem}
            onPress={() => {
              setOverflowOpen(false);
              handleDelete();
            }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.status.error} />
            <Text style={[styles.overflowItemText, { color: theme.colors.status.error }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + theme.spacing.navHeight },
        ]}
        showsVerticalScrollIndicator={false}
        onStartShouldSetResponder={() => {
          if (overflowOpen) setOverflowOpen(false);
          return false;
        }}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{program.cycle_length}</Text>
            <Text style={styles.statLabel}>DAYS / CYCLE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{workDayCount}</Text>
            <Text style={styles.statLabel}>WORKOUT DAYS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, restDayCount > 0 && styles.statValueRest]}>
              {restDayCount}
            </Text>
            <Text style={styles.statLabel}>REST DAYS</Text>
          </View>
        </View>

        {/* Day cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SCHEDULE</Text>
          <Text style={styles.sectionSub}>WEEKLY SPLIT</Text>
        </View>

        {program.days
          .slice()
          .sort((a, b) => a.day_number - b.day_number)
          .map(renderDay)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
    gap: theme.spacing.s,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h3,
  },
  headerSub: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: theme.typography.tracking.label,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activePillText: {
    color: theme.colors.status.active,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activateBtn: {
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activateBtnText: { color: theme.colors.text.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  overflowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overflowMenu: {
    position: 'absolute',
    top: 80,
    right: theme.spacing.m,
    zIndex: 100,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    minWidth: 160,
    paddingVertical: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  overflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
  },
  overflowItemText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  overflowDivider: { height: 1, backgroundColor: theme.colors.ui.border, marginVertical: 4 },

  body: { padding: theme.spacing.m, gap: theme.spacing.m },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, backgroundColor: theme.colors.ui.border },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  statValueRest: { color: theme.colors.status.rest },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.text.tertiary,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: theme.typography.tracking.label,
    textTransform: 'uppercase',
  },

  // Day cards
  dayCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
  },
  dayCardRest: {
    backgroundColor: 'rgba(192, 132, 252, 0.04)',
    borderColor: 'rgba(192, 132, 252, 0.12)',
  },
  dayAccent: {
    width: 3,
    backgroundColor: theme.colors.status.active,
  },
  dayAccentRest: {
    backgroundColor: theme.colors.status.rest,
  },
  dayInner: { flex: 1, padding: theme.spacing.m },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.m,
  },
  dayNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberCircleRest: {
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.3)',
  },
  dayNumberText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.active,
    fontVariant: ['tabular-nums'],
  },
  dayNumberTextRest: { color: theme.colors.status.rest },
  dayTitleBlock: { flex: 1 },
  dayName: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  dayNameRest: { color: theme.colors.status.rest },
  dayTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dayTypeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.status.active,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayTypeTextRest: { color: theme.colors.status.rest },

  exerciseList: { gap: 1 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
  },
  exerciseIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.ui.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  exerciseName: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  setsChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setsChipText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  setsChipLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  restNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },

  errorIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  errorText: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
  },
  goBackBtn: {
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.m,
    marginTop: theme.spacing.m,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  goBackBtnText: {
    color: theme.colors.text.primary,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
