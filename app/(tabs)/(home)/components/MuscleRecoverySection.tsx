import { Ionicons } from '@expo/vector-icons';
import { MuscleRecoveryItem } from '@/api/types/index';
import { theme, typographyStyles } from '@/constants/theme';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { useRecoveryStatus } from '@/hooks/useWorkout';
import { MuscleRecoverySkeleton } from './homeLoadingSkeleton';

interface MuscleRecoverySectionProps {
  onPress?: () => void;
}

const MuscleRecoveryCard = ({
  muscle,
  status,
}: {
  muscle: string;
  status: MuscleRecoveryItem;
}) => {
  const pct = Number(status.recovery_percentage);
  const hoursLeft = Number(status.hours_until_recovery);
  const isReady = status.is_recovered || pct >= 90;

  const timeText = isReady ? 'Ready' : `${Math.round(hoursLeft)}H TO 100%`;
  const displayName = muscle
    .replace(/_/g, ' ')
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.textContainer}>
            <Text style={styles.muscleName}>{displayName}</Text>
            <Text style={styles.timeText}>{timeText}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.pctText}>{pct.toFixed(0)}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: isReady
                    ? theme.colors.status.success
                    : theme.colors.status.active,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function MuscleRecoverySection({ onPress }: MuscleRecoverySectionProps) {
  const { data: recoveryData, refetch, isLoading } = useRecoveryStatus();

  const recoveryStatus = (recoveryData?.recovery_status ?? {}) as Record<
    string,
    MuscleRecoveryItem
  >;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return <MuscleRecoverySkeleton />;
  }

  const recovering = Object.entries(recoveryStatus)
    .filter(([_, s]) => {
      const pct = Number(s.recovery_percentage);
      return pct < 100 && Number(s.hours_until_recovery) > 0;
    })
    .sort((a, b) => a[1].hours_until_recovery - b[1].hours_until_recovery)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
        onPress={onPress}
      >
        <Text style={typographyStyles.h3}>MUSCLE RECOVERY</Text>
        <View style={styles.headerRight}>
          <Text style={typographyStyles.labelMuted}>ANALYTICS</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
        </View>
      </Pressable>

      <View style={styles.cardsContainer}>
        {recovering.length > 0 ? (
          recovering.map(([muscle, status]) => (
            <MuscleRecoveryCard key={muscle} muscle={muscle} status={status} />
          ))
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.allRecoveredCard,
              pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 },
            ]}
            onPress={onPress}
          >
            <View style={styles.recoveredIconWrap}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.status.success} />
            </View>
            <Text style={styles.allRecoveredText}>Recovered and ready to train</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardsContainer: {
    gap: theme.spacing.s,
  },
  allRecoveredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.15)',
    gap: 12,
  },
  recoveredIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  allRecoveredText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.status.success,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  textContainer: {
    gap: 2,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardRight: {
    alignItems: 'flex-end',
    minWidth: 80,
    gap: 6,
  },
  pctText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    width: 70,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
