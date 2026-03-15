import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ActiveWorkoutCoachResponse } from '@/api/types/workout';

interface LiveCoachBannerProps {
  data: ActiveWorkoutCoachResponse | null | undefined;
  onDismiss: () => void;
}

export default function LiveCoachBanner({ data, onDismiss }: LiveCoachBannerProps) {
  if (!data || data.live_decision === 'continue') return null;

  const isStop = data.live_decision === 'stop';
  const color = isStop ? theme.colors.status.error : theme.colors.status.warning;
  const bgColor = isStop ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)';
  const borderColor = isStop ? 'rgba(239,68,68,0.25)' : 'rgba(251,146,60,0.25)';
  const icon: React.ComponentProps<typeof Ionicons>['name'] = isStop ? 'stop-circle-outline' : 'swap-horizontal-outline';
  const message = isStop
    ? 'Coach recommends ending the session'
    : 'Consider switching exercises';

  return (
    <Animated.View entering={FadeInDown.springify().damping(20).stiffness(200)} style={[styles.banner, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.leftBar, { backgroundColor: color }]} />
      <Ionicons name={icon} size={14} color={color} style={styles.icon} />
      <Text style={[styles.message, { color }]} numberOfLines={1}>
        {message}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={12} style={styles.dismiss}>
        <Ionicons name="close" size={14} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leftBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  icon: {
    marginLeft: 10,
    marginRight: 6,
    paddingVertical: 10,
  },
  message: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    paddingVertical: 10,
  },
  dismiss: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
