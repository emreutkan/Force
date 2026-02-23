import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useProgramStore } from '@/state/stores/programStore';

const MIN_CYCLE = 2;
const MAX_CYCLE = 14;

export default function Step1Screen() {
  const insets = useSafeAreaInsets();
  const { name, cycle_length, setName, setCycleLength } = useProgramStore();
  const [nameError, setNameError] = useState('');
  const [cycleError, setCycleError] = useState('');
  // Keep a raw string so the user can type freely; commit parsed value on blur
  const [cycleRaw, setCycleRaw] = useState(String(cycle_length));

  const validateCycle = (raw: string): boolean => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < MIN_CYCLE || n > MAX_CYCLE) {
      setCycleError(`Enter a number between ${MIN_CYCLE} and ${MAX_CYCLE}`);
      return false;
    }
    setCycleError('');
    setCycleLength(n);
    return true;
  };

  const handleNext = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError('Please enter a program name');
      valid = false;
    } else {
      setNameError('');
    }
    if (!validateCycle(cycleRaw)) valid = false;
    if (!valid) return;
    router.push('/(workout-program)/create/step2');
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
          <Text style={styles.headerTitle}>NEW PROGRAM</Text>
          <Text style={styles.headerSub}>STEP 1 OF 3</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepBar, styles.stepBarActive]} />
          <View style={styles.stepBar} />
          <View style={styles.stepBar} />
        </View>

        {/* Section intro */}
        <View style={styles.sectionIntro}>
          <Text style={styles.sectionTitle}>BUILD YOUR PROGRAM</Text>
          <Text style={styles.sectionDesc}>
            Name your split and choose how many days your cycle repeats.
          </Text>
        </View>

        {/* Program Name */}
        <Text style={styles.fieldLabel}>PROGRAM NAME</Text>
        <View style={[styles.inputWrapper, nameError ? styles.inputWrapperError : null]}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Push Pull Legs"
            placeholderTextColor={theme.colors.text.tertiary}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError('');
            }}
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
        {!!nameError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={theme.colors.status.error} />
            <Text style={styles.errorText}>{nameError}</Text>
          </View>
        )}

        {/* Cycle length */}
        <Text style={[styles.fieldLabel, { marginTop: theme.spacing.xxl }]}>CYCLE LENGTH</Text>
        <Text style={styles.fieldHint}>
          How many days before the cycle repeats? ({MIN_CYCLE}–{MAX_CYCLE})
        </Text>
        <View style={[styles.inputWrapper, cycleError ? styles.inputWrapperError : null]}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4"
            placeholderTextColor={theme.colors.text.tertiary}
            value={cycleRaw}
            onChangeText={(v) => {
              // Allow only digits
              const digits = v.replace(/[^0-9]/g, '');
              setCycleRaw(digits);
              if (cycleError) setCycleError('');
            }}
            onBlur={() => validateCycle(cycleRaw)}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={2}
          />
        </View>
        {!!cycleError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color={theme.colors.status.error} />
            <Text style={styles.errorText}>{cycleError}</Text>
          </View>
        )}
        <View style={styles.hintBox}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={theme.colors.text.tertiary}
          />
          <Text style={styles.hintText}>Example: Push · Pull · Legs · Rest = 4 days</Text>
        </View>

        {/* Next button */}
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>NEXT STEP</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
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

  sectionIntro: { marginBottom: theme.spacing.xxl },
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

  fieldLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: theme.typography.tracking.label,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.s,
  },
  fieldHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.m,
    marginTop: -4,
  },
  inputWrapper: {
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  inputWrapperError: { borderColor: theme.colors.status.error },
  input: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.sizes.xs,
  },

  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.m,
  },
  hintText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    flex: 1,
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.l,
    marginTop: theme.spacing.xxxl,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
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
});
