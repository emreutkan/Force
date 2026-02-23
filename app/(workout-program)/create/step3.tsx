import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useProgramStore } from '@/state/stores/programStore';
import { useCreateProgram } from '@/hooks/useWorkoutProgram';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import type { ProgramDraftDay } from '@/api/types/program';

export default function Step3Screen() {
  const insets = useSafeAreaInsets();
  const {
    name,
    cycle_length,
    days,
    addExerciseToDay,
    removeExerciseFromDay,
    updateExerciseSets,
    moveExercise,
    reset,
  } = useProgramStore();
  const createProgram = useCreateProgram();

  const nonRestDays = days.filter((d) => !d.is_rest_day);
  const [activeTab, setActiveTab] = useState(nonRestDays[0]?.day_number ?? 1);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [validationError, setValidationError] = useState('');

  const activeDay: ProgramDraftDay | undefined = days.find((d) => d.day_number === activeTab);

  const handleAddExercise = (exerciseId: number, exercise?: any) => {
    if (!activeDay) return;
    addExerciseToDay(activeDay.day_number, {
      exercise_id: exerciseId,
      exercise_name: exercise?.name ?? `Exercise ${exerciseId}`,
      target_sets: 3,
      order: activeDay.exercises.length + 1,
    });
    setShowExercisePicker(false);
  };

  const validateAndCreate = async () => {
    const emptyDay = nonRestDays.find(
      (d) => days.find((dd) => dd.day_number === d.day_number)?.exercises.length === 0
    );
    if (emptyDay) {
      setValidationError(`"${emptyDay.name}" needs at least one exercise`);
      return;
    }
    setValidationError('');

    const payload = {
      name: name.trim(),
      cycle_length,
      days: days.map((d) => ({
        day_number: d.day_number,
        name: d.name,
        is_rest_day: d.is_rest_day,
        exercises: d.exercises.map((e, i) => ({
          exercise_id: e.exercise_id,
          target_sets: e.target_sets,
          order: i + 1,
        })),
      })),
    };

    try {
      const created = await createProgram.mutateAsync(payload);
      reset();
      router.replace(`/(workout-program)/${created.id}`);
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to create program';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99,101,241,0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ADD EXERCISES</Text>
          <Text style={styles.headerSub}>STEP 3 OF 3</Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepBar, styles.stepBarActive]} />
        <View style={[styles.stepBar, styles.stepBarActive]} />
        <View style={[styles.stepBar, styles.stepBarActive]} />
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {days.map((d) => (
          <Pressable
            key={d.day_number}
            style={[
              styles.tab,
              d.day_number === activeTab && styles.tabActive,
              d.is_rest_day && styles.tabRest,
            ]}
            onPress={() => {
              if (!d.is_rest_day) setActiveTab(d.day_number);
            }}
          >
            <Text
              style={[
                styles.tabText,
                d.day_number === activeTab && styles.tabTextActive,
                d.is_rest_day && styles.tabTextRest,
              ]}
              numberOfLines={1}
            >
              {d.name || `Day ${d.day_number}`}
            </Text>
            {!d.is_rest_day && d.day_number === activeTab && (
              <View style={styles.tabActiveIndicator} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Content for active day */}
      {activeDay?.is_rest_day ? (
        <View style={styles.restDayMsg}>
          <View style={styles.restDayIcon}>
            <Ionicons name="moon-outline" size={28} color={theme.colors.status.rest} />
          </View>
          <Text style={styles.restDayTitle}>REST DAY</Text>
          <Text style={styles.restDaySubtitle}>No exercises for this day</Text>
        </View>
      ) : (
        <FlatList
          data={activeDay?.exercises ?? []}
          keyExtractor={(item) => item.exercise_id.toString()}
          contentContainerStyle={[styles.exerciseList, { paddingBottom: insets.bottom + 120 }]}
          ListEmptyComponent={
            <View style={styles.emptyExercises}>
              <View style={styles.emptyExercisesIcon}>
                <Ionicons name="barbell-outline" size={28} color={theme.colors.status.active} />
              </View>
              <Text style={styles.emptyExercisesTitle}>NO EXERCISES</Text>
              <Text style={styles.emptyExercisesText}>Tap the button below to add your first exercise</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.exerciseRow}>
              {/* Order number */}
              <View style={styles.exerciseOrderBadge}>
                <Text style={styles.exerciseOrderText}>{index + 1}</Text>
              </View>

              {/* Exercise info */}
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {item.exercise_name.toUpperCase()}
                </Text>
                <Text style={styles.exerciseLabel}>TARGET SETS</Text>
              </View>

              {/* Sets stepper */}
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateExerciseSets(activeTab, item.exercise_id, Math.max(1, item.target_sets - 1))
                  }
                >
                  <Ionicons name="remove" size={14} color={theme.colors.text.secondary} />
                </Pressable>
                <Text style={styles.stepperValue}>{item.target_sets}</Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateExerciseSets(activeTab, item.exercise_id, Math.min(10, item.target_sets + 1))
                  }
                >
                  <Ionicons name="add" size={14} color={theme.colors.text.secondary} />
                </Pressable>
              </View>

              {/* Reorder + Remove column */}
              <View style={styles.actionCol}>
                <Pressable
                  disabled={index === 0}
                  onPress={() => moveExercise(activeTab, item.exercise_id, 'up')}
                  style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                >
                  <Ionicons name="chevron-up" size={12} color={theme.colors.text.secondary} />
                </Pressable>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeExerciseFromDay(activeTab, item.exercise_id)}
                >
                  <Ionicons name="close" size={13} color={theme.colors.status.error} />
                </Pressable>
                <Pressable
                  disabled={index === (activeDay?.exercises.length ?? 1) - 1}
                  onPress={() => moveExercise(activeTab, item.exercise_id, 'down')}
                  style={[
                    styles.reorderBtn,
                    index === (activeDay?.exercises.length ?? 1) - 1 && styles.reorderBtnDisabled,
                  ]}
                >
                  <Ionicons name="chevron-down" size={12} color={theme.colors.text.secondary} />
                </Pressable>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListFooterComponent={
            <Pressable style={styles.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
              <View style={styles.addExerciseBtnIcon}>
                <Ionicons name="add" size={18} color={theme.colors.status.active} />
              </View>
              <Text style={styles.addExerciseBtnText}>ADD EXERCISE</Text>
            </Pressable>
          }
        />
      )}

      {/* Validation error */}
      {!!validationError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={theme.colors.status.error} />
          <Text style={styles.errorBannerText}>{validationError}</Text>
        </View>
      )}

      {/* Bottom buttons */}
      <View style={[styles.bottomRow, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.backBtnLarge} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.backBtnLargeText}>BACK</Text>
        </Pressable>
        <Pressable
          style={[styles.createBtn, createProgram.isPending && styles.createBtnDisabled]}
          onPress={validateAndCreate}
          disabled={createProgram.isPending}
        >
          {createProgram.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.createBtnText}>CREATE PROGRAM</Text>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </>
          )}
        </Pressable>
      </View>

      <ExerciseSearchModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelectExercise={handleAddExercise}
        onToggleExercise={handleAddExercise}
        title="Add Exercise"
        mode="single"
        excludeExerciseIds={activeDay?.exercises.map((e) => e.exercise_id) ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    gap: 12,
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

  stepRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  stepBarActive: {
    backgroundColor: theme.colors.status.active,
    borderColor: theme.colors.status.active,
  },

  tabsScroll: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.m,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  },
  tabRest: { opacity: 0.35 },
  tabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '800',
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabTextActive: { color: theme.colors.status.active },
  tabTextRest: { color: theme.colors.status.rest },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: -9,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.status.active,
  },

  exerciseList: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
  },
  exerciseOrderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseOrderText: {
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  exerciseLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    width: 28,
    textAlign: 'center',
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },

  actionCol: { alignItems: 'center', gap: 2 },
  reorderBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnDisabled: { opacity: 0.2 },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.l,
    paddingVertical: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  addExerciseBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.ui.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseBtnText: {
    color: theme.colors.status.active,
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  emptyExercises: { padding: 40, alignItems: 'center', gap: 12 },
  emptyExercisesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyExercisesTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
  },
  emptyExercisesText: {
    color: theme.colors.text.tertiary,
    fontWeight: '500',
    fontSize: theme.typography.sizes.s,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 22,
  },

  restDayMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  restDayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.rest,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
  },
  restDaySubtitle: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,69,58,0.2)',
    padding: theme.spacing.m,
  },
  errorBannerText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    flex: 1,
  },

  bottomRow: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    backgroundColor: theme.colors.background,
  },
  backBtnLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.m,
  },
  backBtnLargeText: {
    color: theme.colors.text.secondary,
    fontWeight: '800',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  createBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.m,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  createBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  createBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
