import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface HomeHeaderProps {
  today: Date;
  insets: { top: number };
}

export default function HomeHeader({ today, insets }: HomeHeaderProps) {
  return (
    <View style={[styles.forceHeader, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={typographyStyles.h1}>
          FORCE
          <Text style={{ color: theme.colors.status.active }}>.</Text>
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/(account)')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.gearButton,
              pressed && styles.gearButtonPressed
            ]}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
      </View>
      <View style={styles.dateContainer}>
        <Text style={styles.headerDate}>
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forceHeader: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.l,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  gearButton: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gearButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ scale: 0.96 }],
  },
  dateContainer: { 
    marginTop: theme.spacing.xs,
  },
  headerDate: {
    ...typographyStyles.labelMuted,
    fontSize: theme.typography.sizes.xs,
    letterSpacing: theme.typography.tracking.wider,
    color: theme.colors.text.tertiary,
  },
});
