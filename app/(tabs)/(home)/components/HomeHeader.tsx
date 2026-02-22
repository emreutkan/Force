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
          {/* AI Chat button */}
          <Pressable
            onPress={() => router.push('/(chat)')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.aiButton}
          >
            <Ionicons name="sparkles" size={14} color={theme.colors.status.active} />
            <Text style={styles.aiButtonText}>AI</Text>
          </Pressable>

          {/* Settings button */}
          <Pressable
            onPress={() => router.push('/(account)')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.gearButton}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.secondary} />
          </Pressable>
        </View>
      </View>
      <View style={styles.header}>
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
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.ui.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiButtonText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 1.5,
  },
  gearButton: {
    padding: theme.spacing.xs,
  },
  header: { marginBottom: theme.spacing.s },
  headerDate: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.tight,
  },
});
