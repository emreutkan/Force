import React from 'react';
import { CNSRecoveryItem } from '@/api/types';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { formatTimeRemaining, getStatusColor } from '@/utils/recoveryStatusHelpers';

interface CNSCardProps {
  data: CNSRecoveryItem;
}

export default function CNSCard({ data }: CNSCardProps) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;
  const cnsLoad = Number(data.cns_load);

  const accentColor = isReady ? theme.colors.status.success : color;
  const badgeBg = `${accentColor}10`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}20` }]}>
          <Ionicons name="pulse" size={20} color={accentColor} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title}>CENTRAL NERVOUS SYSTEM</Text>
          <Text style={styles.subtitle}>{isReady ? 'RECOVERED' : 'STILL RECOVERING'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: `${accentColor}25` }]}>
          <Text style={[styles.statusText, { color: accentColor }]}>
            {isReady ? 'READY' : formatTimeRemaining(hoursLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>RECOVERY</Text>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: accentColor }]}>{pct.toFixed(0)}</Text>
            <Text style={[styles.metricUnit, { color: accentColor }]}>%</Text>
          </View>
        </View>
        {cnsLoad > 0 && (
          <View style={[styles.metricBlock, styles.metricBorder]}>
            <Text style={styles.metricLabel}>LOAD</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{cnsLoad.toFixed(0)}</Text>
              <Text style={styles.metricUnit}>PTS</Text>
            </View>
          </View>
        )}
        {!isReady && (
          <View style={[styles.metricBlock, styles.metricBorder]}>
            <Text style={styles.metricLabel}>TO 100%</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{Math.ceil(hoursLeft).toString()}</Text>
              <Text style={styles.metricUnit}>H</Text>
            </View>
          </View>
        )}
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
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typographyStyles.label,
    fontSize: 12,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typographyStyles.label,
    fontSize: 9,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    ...typographyStyles.label,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.l,
  },
  metricBlock: {
    flex: 1,
    gap: 4,
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.06)',
    paddingLeft: theme.spacing.l,
  },
  metricLabel: {
    ...typographyStyles.label,
    fontSize: 8,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    ...typographyStyles.data,
    fontSize: 24,
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  metricUnit: {
    ...typographyStyles.label,
    fontSize: 11,
    marginLeft: 1,
    color: theme.colors.text.tertiary,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
