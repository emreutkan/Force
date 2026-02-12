import { theme, typographyStyles } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HomeHeaderProps {
  today: Date;
  insets: { top: number };
}

export default function HomeHeader({ today, insets }: HomeHeaderProps) {
  return (
    <View style={[styles.forceHeader, { paddingTop: insets.top }]}>
      <Text style={typographyStyles.h1}>
        FORCE
        <Text style={{ color: theme.colors.status.active }}>.</Text>
      </Text>
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
  header: { marginBottom: theme.spacing.s },
  headerDate: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.tight,
  },
});
