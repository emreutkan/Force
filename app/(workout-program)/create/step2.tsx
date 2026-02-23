import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useProgramStore } from '@/state/stores/programStore';

const defaultWorkoutName = (dayNumber: number) => `Workout ${dayNumber}`;
const DEFAULT_REST_NAME = 'Rest';

export default function Step2Screen() {
  const insets = useSafeAreaInsets();
  const { days, cycle_length, initDays, setDayName, setDayRestDay, setCycleLength } =
    useProgramStore();

  const [showRestWarning, setShowRestWarning] = useState(false);

  // Track touched days via ref so we don't trigger list re-renders
  const touchedRef = useRef<Set<number>>(new Set());

  // ─── Seed defaults ──────────────────────────────────────────────────────────
  useEffect(() => {
    initDays();
  }, [initDays]);

  useEffect(() => {
    days.forEach((day) => {
      if (day.name.trim() === '') {
        setDayName(
          day.day_number,
          day.is_rest_day ? DEFAULT_REST_NAME : defaultWorkoutName(day.day_number)
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  // ─── Field handlers ─────────────────────────────────────────────────────────

  const handleFocus = (dayNumber: number, currentName: string) => {
    if (!touchedRef.current.has(dayNumber)) {
      const isDefault =
        currentName === defaultWorkoutName(dayNumber) || currentName === DEFAULT_REST_NAME;
      if (isDefault) setDayName(dayNumber, '');
    }
  };

  const handleChange = (dayNumber: number, value: string) => {
    touchedRef.current.add(dayNumber);
    setDayName(dayNumber, value);
  };

  const handleBlur = (day: { day_number: number; is_rest_day: boolean; name: string }) => {
    if (day.name.trim() === '') {
      touchedRef.current.delete(day.day_number);
      setDayName(
        day.day_number,
        day.is_rest_day ? DEFAULT_REST_NAME : defaultWorkoutName(day.day_number)
      );
    }
  };

  const handleSetRestDay = (dayNumber: number, isRest: boolean) => {
    touchedRef.current.delete(dayNumber);
    setDayRestDay(dayNumber, isRest);
    if (!isRest) setDayName(dayNumber, defaultWorkoutName(dayNumber));
  };

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const hasAnyRestDay = days.some((d) => d.is_rest_day);

  const handleNext = () => {
    if (!hasAnyRestDay) {
      setShowRestWarning(true);
      return;
    }
    router.push('/(workout-program)/create/step3');
  };

  const addRestDayAndContinue = () => {
    const newLength = cycle_length + 1;
    setCycleLength(newLength);
    initDays();
    setDayRestDay(newLength, true);
    setShowRestWarning(false);
    router.push('/(workout-program)/create/step3');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

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
          <Text style={styles.headerTitle}>NAME YOUR DAYS</Text>
          <Text style={styles.headerSub}>STEP 2 OF 3</Text>
        </View>
      </View>

      {/* Keyboard-aware scroll area */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepBar, styles.stepBarActive]} />
            <View style={[styles.stepBar, styles.stepBarActive]} />
            <View style={styles.stepBar} />
          </View>

          {/* Section intro */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionTitle}>DEFINE YOUR SPLIT</Text>
            <Text style={styles.sectionDesc}>
              Each day gets a default name — tap to rename it, or leave it as-is.
            </Text>
          </View>

          {/* Rename hint */}
          <View style={styles.renameHint}>
            <Ionicons name="create-outline" size={13} color={theme.colors.text.tertiary} />
            <Text style={styles.renameHintText}>Tap a name to rename it</Text>
          </View>

          {/* Day rows */}
          {days.map((day) => (
            <View
              key={day.day_number}
              style={[styles.dayCard, day.is_rest_day && styles.dayCardRest]}
            >
              {day.is_rest_day ? (
                <View style={styles.restAccent} />
              ) : (
                <View style={styles.workAccent} />
              )}

              <View style={styles.dayCardInner}>
                <View style={styles.dayCardTop}>
                  {/* Day number badge */}
                  <View style={[styles.dayCircle, day.is_rest_day && styles.dayCircleRest]}>
                    <Text
                      style={[styles.dayCircleText, day.is_rest_day && styles.dayCircleTextRest]}
                    >
                      {day.day_number}
                    </Text>
                  </View>

                  {/* Name input */}
                  <View style={styles.inputBlock}>
                    <TextInput
                      style={[styles.dayInput, day.is_rest_day && styles.dayInputDisabled]}
                      value={day.name}
                      onFocus={() => handleFocus(day.day_number, day.name)}
                      onChangeText={(v) => handleChange(day.day_number, v)}
                      onBlur={() => handleBlur(day)}
                      editable={!day.is_rest_day}
                      returnKeyType="done"
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                </View>

                {/* WORK / REST toggle */}
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[styles.toggleBtn, !day.is_rest_day && styles.toggleBtnWork]}
                    onPress={() => handleSetRestDay(day.day_number, false)}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={12}
                      color={!day.is_rest_day ? '#fff' : theme.colors.text.tertiary}
                    />
                    <Text
                      style={[styles.toggleBtnText, !day.is_rest_day && styles.toggleBtnTextActive]}
                    >
                      WORK
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.toggleBtn, day.is_rest_day && styles.toggleBtnRest]}
                    onPress={() => handleSetRestDay(day.day_number, true)}
                  >
                    <Ionicons
                      name="moon-outline"
                      size={12}
                      color={
                        day.is_rest_day ? theme.colors.status.rest : theme.colors.text.tertiary
                      }
                    />
                    <Text
                      style={[styles.toggleBtnText, day.is_rest_day && styles.toggleBtnTextRest]}
                    >
                      REST
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={styles.backBtnLarge} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.backBtnLargeText}>BACK</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>NEXT STEP</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── No Rest Day Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showRestWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestWarning(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRestWarning(false)}>
          {/* Inner Pressable stops tap-through closing the modal */}
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="moon-outline" size={28} color={theme.colors.status.rest} />
            </View>

            <Text style={styles.modalTitle}>NO REST DAY</Text>
            <Text style={styles.modalBody}>
              Your program has no rest day. Recovery is important — would you like to add a rest day
              at the end of your cycle?
            </Text>
            <Text style={styles.modalSubBody}>
              This will extend your cycle to{' '}
              <Text style={styles.modalHighlight}>{cycle_length + 1} days</Text>.
            </Text>

            <Pressable style={styles.modalBtnPrimary} onPress={addRestDayAndContinue}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.modalBtnPrimaryText}>ADD REST DAY</Text>
            </Pressable>

            <Pressable
              style={styles.modalBtnSecondary}
              onPress={() => {
                setShowRestWarning(false);
                router.push('/(workout-program)/create/step3');
              }}
            >
              <Text style={styles.modalBtnSecondaryText}>No, continue without rest</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
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

  body: { padding: theme.spacing.m, paddingTop: theme.spacing.l },

  stepRow: { flexDirection: 'row', gap: 6, marginBottom: theme.spacing.xxl },
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

  sectionIntro: { marginBottom: theme.spacing.m },
  sectionTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    lineHeight: 22,
  },

  renameHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.m,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  renameHintText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },

  // Day cards
  dayCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    marginBottom: theme.spacing.s,
  },
  dayCardRest: {
    backgroundColor: 'rgba(192,132,252,0.04)',
    borderColor: 'rgba(192,132,252,0.12)',
  },
  workAccent: { width: 3, backgroundColor: theme.colors.status.active },
  restAccent: { width: 3, backgroundColor: theme.colors.status.rest },
  dayCardInner: {
    flex: 1,
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  dayCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleRest: {
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.3)',
  },
  dayCircleText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.active,
    fontVariant: ['tabular-nums'],
  },
  dayCircleTextRest: { color: theme.colors.status.rest },
  inputBlock: { flex: 1 },
  dayInput: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.m,
    height: 44,
    paddingHorizontal: theme.spacing.m,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.s,
    fontWeight: '700',
  },
  dayInputDisabled: { opacity: 0.35 },

  // WORK / REST toggle
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  toggleBtnWork: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  },
  toggleBtnRest: {
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.3)',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  toggleBtnTextActive: { color: theme.colors.status.active },
  toggleBtnTextRest: { color: theme.colors.status.rest },

  // Bottom buttons
  buttonRow: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.l },
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
  nextBtn: {
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
  nextBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.s,
  },
  modalBody: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.s,
  },
  modalSubBody: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalHighlight: {
    color: theme.colors.status.rest,
    fontWeight: '800',
  },
  modalBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: theme.colors.status.rest,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modalBtnSecondary: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  modalBtnSecondaryText: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
