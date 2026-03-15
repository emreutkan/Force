import { commonStyles, theme } from '@/constants/theme';
import { useUser } from '@/hooks/useUser';
import { useUserStats } from '@/hooks/useWorkout';
import { useSettingsStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function buildEnter(delay: number) {
  return FadeInDown.delay(delay).duration(380).reduceMotion(ReduceMotion.System);
}

function AccountRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  onPress,
  badge,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBackground: string;
  onPress?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  const isPressable = !!onPress && !disabled;

  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {badge ? (
        <View style={styles.rowBadge}>
          <Text style={styles.rowBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {!disabled ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
      ) : null}
    </>
  );

  if (!isPressable) {
    return <View style={[styles.row, disabled && styles.rowDisabled]}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
  );
}

function StepperRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBackground,
  value,
  onDecrease,
  onIncrease,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBackground: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <View style={styles.stepperContainer}>
        <Pressable
          hitSlop={4}
          onPress={onDecrease}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
        >
          <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          hitSlop={4}
          onPress={onIncrease}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
        >
          <Ionicons name="add" size={16} color={theme.colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { data: stats } = useUserStats();
  const {
    tutCountdown,
    tutReactionOffset,
    setTutCountdown,
    setTutReactionOffset,
    isPro,
  } = useSettingsStore();

  const userEmail = user?.email || 'No email';
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : 2024;
  const planLabel = user?.is_trial ? 'TRIAL' : isPro ? 'PRO' : 'FREE';
  const planTitle = user?.is_trial ? 'Trial active' : isPro ? 'Pro plan' : 'Free plan';
  const planSubtitle =
    user?.is_trial && user?.trial_days_remaining !== null
      ? `${user.trial_days_remaining} days left`
      : user?.is_paid_pro && user?.pro_days_remaining !== null
        ? `${user.pro_days_remaining} days left`
        : isPro
          ? 'Manage your subscription'
          : 'Upgrade for advanced insights';

  const statCards = [
    {
      label: 'Current streak',
      value: String(stats?.streak.current ?? '--'),
      accent: '#FF9F0A',
      icon: 'flame' as const,
    },
    {
      label: 'Workouts',
      value: String(stats?.sessions.total ?? '--'),
      accent: theme.colors.status.active,
      icon: 'barbell-outline' as const,
    },
    {
      label: 'Avg session',
      value: stats ? formatMinutes(stats.time.avg_per_session_minutes) : '--',
      accent: theme.colors.status.success,
      icon: 'time-outline' as const,
    },
    {
      label: 'Total volume',
      value: stats ? formatVolume(stats.volume_kg.total) : '--',
      accent: theme.colors.status.rest,
      icon: 'layers-outline' as const,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <View style={styles.backHeader}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>ACCOUNT</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View
          style={[
            styles.planChip,
            {
              backgroundColor: isPro ? 'rgba(192, 132, 252, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              borderColor: isPro ? 'rgba(192, 132, 252, 0.25)' : 'rgba(99, 102, 241, 0.25)',
            },
          ]}
        >
          <Text
            style={[
              styles.planChipText,
              { color: isPro ? theme.colors.status.rest : theme.colors.status.active },
            ]}
          >
            {planLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={buildEnter(40)} style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
          </LinearGradient>

          <View style={styles.profileInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
            <Text style={styles.memberSince}>Joined {memberSince}</Text>
            <Text style={styles.profileNote}>{planTitle}. {planSubtitle}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={buildEnter(100)} style={styles.statsGrid}>
          {statCards.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Ionicons name={stat.icon} size={14} color={stat.accent} />
              </View>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={buildEnter(160)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Progress</Text>
          </View>
          <View style={styles.group}>
            <AccountRow
              title="Exercise stats"
              subtitle="View strength and volume by exercise"
              icon="barbell-outline"
              iconColor={theme.colors.text.brand}
              iconBackground="rgba(99, 102, 241, 0.1)"
              onPress={() => router.push('/(exercise-statistics)/list')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={buildEnter(220)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Timing</Text>
          </View>
          <View style={styles.group}>
            <StepperRow
              title="Rep start delay"
              subtitle="Seconds before TUT tracking starts"
              icon="timer-outline"
              iconColor={theme.colors.status.warning}
              iconBackground="rgba(255, 159, 10, 0.1)"
              value={`${tutCountdown}s`}
              onDecrease={() => setTutCountdown(Math.max(0, tutCountdown - 1))}
              onIncrease={() => setTutCountdown(Math.min(10, tutCountdown + 1))}
            />

            <View style={styles.separator} />

            <StepperRow
              title="Reaction buffer"
              subtitle="Seconds removed from TUT timing"
              icon="speedometer-outline"
              iconColor={theme.colors.status.error}
              iconBackground="rgba(255, 69, 58, 0.1)"
              value={`${tutReactionOffset}s`}
              onDecrease={() => setTutReactionOffset(Math.max(0, tutReactionOffset - 1))}
              onIncrease={() => setTutReactionOffset(Math.min(5, tutReactionOffset + 1))}
            />
          </View>
        </Animated.View>

        <Animated.View entering={buildEnter(280)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Membership</Text>
          </View>
          <View style={styles.group}>
            <AccountRow
              title={planTitle}
              subtitle={planSubtitle}
              icon={isPro ? 'star' : 'star-outline'}
              iconColor={isPro ? theme.colors.status.rest : theme.colors.status.active}
              iconBackground={isPro ? 'rgba(192, 132, 252, 0.1)' : 'rgba(99, 102, 241, 0.1)'}
              onPress={() => router.push('/(account)/upgrade')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={buildEnter(340)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Account</Text>
          </View>
          <View style={styles.group}>
            <AccountRow
              title="Manage account"
              subtitle="Email, password, and body metrics"
              icon="person-outline"
              iconColor={theme.colors.text.brand}
              iconBackground="rgba(99, 102, 241, 0.1)"
              onPress={() => router.push('/(account)/manage')}
            />

            <View style={styles.separator} />

            <AccountRow
              title="Health data"
              subtitle="Apple Health and Health Connect integration"
              icon="pulse-outline"
              iconColor={theme.colors.text.secondary}
              iconBackground="rgba(255, 255, 255, 0.05)"
              badge="SOON"
              disabled
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.m,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  planChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  planChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userEmail: {
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  memberSince: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  profileNote: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.m,
    gap: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.s,
  },
  statLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
  },
  sectionWrap: {
    marginBottom: theme.spacing.l,
  },
  sectionHeader: {
    marginBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  group: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  rowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  rowDisabled: {
    opacity: 0.85,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.ui.border,
    marginLeft: 68,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  rowSub: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  rowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  rowBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepperValue: {
    minWidth: 38,
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
