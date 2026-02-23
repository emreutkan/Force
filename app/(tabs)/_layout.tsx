import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import BottomNavigator from '@/components/BottomNavigator';
import { useActiveWorkout } from '@/hooks/useWorkout';
import { theme } from '@/constants/theme';

export default function TabsLayout() {
  // Single subscription for active-workout so tab screens (Home ActiveSection, Workouts) share one fetch
  useActiveWorkout();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
      </View>
      <BottomNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
