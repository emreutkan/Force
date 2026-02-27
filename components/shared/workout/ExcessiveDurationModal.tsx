import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExcessiveDurationModalProps {
  visible: boolean;
  onNormalize: () => void;
  onProceedAsIs: () => void;
  onCancel: () => void;
}

export default function ExcessiveDurationModal({
  visible,
  onNormalize,
  onProceedAsIs,
  onCancel,
}: ExcessiveDurationModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <View style={styles.iconInner}>
            <Ionicons name="time-outline" size={28} color={theme.colors.status.warning} />
          </View>
        </View>

        {/* Text */}
        <Text style={styles.title}>Workout Duration Seems Long</Text>
        <Text style={styles.subtitle}>
          Your recorded time is much longer than expected based on your sets and rest periods. Would
          you like to use the calculated duration or keep your original timer?
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Option: Normalize */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
          onPress={onNormalize}
        >
          <View style={[styles.optionIconWrap, styles.optionIconNormalize]}>
            <Ionicons name="calculator-outline" size={20} color={theme.colors.status.active} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Use Calculated Time</Text>
            <Text style={styles.optionDesc}>
              Backend caps duration based on your actual sets & rest periods
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
        </Pressable>

        {/* Option: Keep original */}
        <Pressable
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
          onPress={onProceedAsIs}
        >
          <View style={[styles.optionIconWrap, styles.optionIconKeep]}>
            <Ionicons name="timer-outline" size={20} color={theme.colors.status.warning} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Keep My Time</Text>
            <Text style={styles.optionDesc}>Save your raw timer value exactly as recorded</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
        </Pressable>

        {/* Cancel */}
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
          onPress={onCancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111115',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.ui.glassStrong,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  iconBadge: {
    alignSelf: 'center',
    marginBottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionRowPressed: {
    backgroundColor: theme.colors.ui.glass,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  optionIconNormalize: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  optionIconKeep: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderColor: 'rgba(255, 159, 10, 0.25)',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionDesc: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  cancelButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cancelPressed: {
    opacity: 0.7,
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
