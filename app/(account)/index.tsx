import { commonStyles, theme } from '@/constants/theme';
import { useUser } from '@/hooks/useUser';
import { useUserStats } from '@/hooks/useWorkout';
import { useSettingsStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
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

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const { data: stats } = useUserStats();
  const { tutCountdown, tutReactionOffset, setTutCountdown, setTutReactionOffset, isPro } = useSettingsStore();

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
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              MEMBER SINCE {user?.created_at ? new Date(user.created_at).getFullYear() : 2024}
            </Text>
          </View>
        </View>

        {/* Compact Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statChip}>
            <View style={styles.statChipRow}>
              <Text style={styles.statChipValue}>{stats?.streak.current ?? '—'}</Text>
              <Ionicons name="flame" size={12} color="#FF9F0A" style={{ marginTop: 1 }} />
            </View>
            <Text style={styles.statChipLabel}>STREAK</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>{stats?.sessions.total ?? '—'}</Text>
            <Text style={styles.statChipLabel}>SESSIONS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>
              {stats ? formatMinutes(stats.time.avg_per_session_minutes) : '—'}
            </Text>
            <Text style={styles.statChipLabel}>AVG SESSION</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>
              {stats ? formatVolume(stats.volume_kg.total) : '—'}
            </Text>
            <Text style={styles.statChipLabel}>TOTAL VOL</Text>
          </View>
        </View>

        {/* Analytics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ANALYTICS</Text>
        </View>
        <View style={styles.group}>
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(exercise-statistics)/list')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="barbell-outline" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>EXERCISE STATISTICS</Text>
              <Text style={styles.rowSub}>PERFORMANCE BY EXERCISE</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Workout Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>WORKOUT</Text>
        </View>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 159, 10, 0.1)' }]}>
              <Ionicons name="timer-outline" size={20} color={theme.colors.status.warning} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>TUT COUNTDOWN</Text>
              <Text style={styles.rowSub}>SECONDS BEFORE TRACKING STARTS</Text>
            </View>
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutCountdown(Math.max(0, tutCountdown - 1))}
              >
                <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{tutCountdown}s</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutCountdown(Math.min(10, tutCountdown + 1))}
              >
                <Ionicons name="add" size={16} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.status.error} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>REACTION OFFSET</Text>
              <Text style={styles.rowSub}>SECONDS SUBTRACTED FROM TUT</Text>
            </View>
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutReactionOffset(Math.max(0, tutReactionOffset - 1))}
              >
                <Ionicons name="remove" size={16} color={theme.colors.text.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{tutReactionOffset}s</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTutReactionOffset(Math.min(5, tutReactionOffset + 1))}
              >
                <Ionicons name="add" size={16} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>SUBSCRIPTION</Text>
        </View>
        <View style={styles.group}>
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(account)/upgrade')}
          >
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isPro
                    ? 'rgba(192, 132, 252, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
            >
              <Ionicons
                name={isPro ? 'star' : 'star-outline'}
                size={20}
                color={isPro ? theme.colors.status.rest : theme.colors.status.active}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>
                {isPro ? (user?.is_trial ? 'FREE TRIAL' : 'PRO MEMBER') : 'FREE PLAN'}
              </Text>
              <Text style={styles.rowSub}>
                {user?.is_trial && user?.trial_days_remaining !== null
                  ? `${user.trial_days_remaining} DAYS LEFT`
                  : user?.is_paid_pro && user?.pro_days_remaining !== null
                    ? `${user.pro_days_remaining} DAYS LEFT`
                    : isPro
                      ? 'ACTIVE'
                      : 'UPGRADE TO PRO'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Account */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>ACCOUNT</Text>
        </View>
        <View style={styles.group}>
          <Pressable
            style={styles.row}
            onPress={() => router.push('/(account)/manage')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="person-outline" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>ACCOUNT MANAGEMENT</Text>
              <Text style={styles.rowSub}>EMAIL, PASSWORD, BODY METRICS</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.separator} />

          <Pressable
            style={styles.row}
            onPress={() => router.push('/(permissions)')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="pulse-outline" size={20} color={theme.colors.text.secondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>HEALTH CONNECT</Text>
              <Text style={styles.rowSub}>SYNC HEALTH DATA</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },

  // --- Profile Header ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.xs,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  profileInfo: {
    marginLeft: theme.spacing.m,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // --- Compact Stats Strip ---
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.m,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChipValue: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.ui.border,
    alignSelf: 'center',
  },

  // --- Sections ---
  sectionHeader: {
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 3.6,
  },

  // --- Grouped Rows (iOS-style) ---
  group: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.ui.border,
    marginLeft: 68,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: theme.colors.text.primary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  rowSub: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // --- Stepper ---
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'center',
  },
});
