import React from 'react';
import { MuscleRecoveryItem } from '@/api/types';
import { theme, typographyStyles } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimeRemaining, getStatusColor } from '@/utils/recoveryStatusHelpers';

interface MuscleCardProps {
  muscle: string;
  data: MuscleRecoveryItem;
}

export default function MuscleCard({ muscle, data }: MuscleCardProps) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;
  const timeDisplay = isReady ? 'READY' : formatTimeRemaining(hoursLeft);
  const sets = data.total_sets;
  const label = muscle.replace(/_/g, ' ').toUpperCase();

  const badgeBg = isReady
    ? 'rgba(48,209,88,0.1)'
    : pct >= 50
      ? 'rgba(255,159,10,0.1)'
      : 'rgba(255,69,58,0.1)';

  const accentColor = isReady ? theme.colors.status.success : color;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.muscleName}>{label}</Text>
          {sets > 0 && (
            <Text style={styles.setsLabel}>{sets} SETS LOGGED</Text>
          )}
        </View>
        <View style={styles.right}>
          <View style={styles.pctRow}>
            <Text style={[styles.pct, { color: accentColor }]}>{pct.toFixed(0)}</Text>
            <Text style={[styles.pctUnit, { color: accentColor }]}>%</Text>
          </View>
          {!isReady && (
            <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: `${accentColor}25` }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>{timeDisplay}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  muscleName: {
    ...typographyStyles.label,
    fontSize: 14,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  setsLabel: {
    ...typographyStyles.label,
    fontSize: 10,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pct: {
    ...typographyStyles.data,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  pctUnit: {
    ...typographyStyles.label,
    fontSize: 12,
    marginLeft: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    ...typographyStyles.label,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
