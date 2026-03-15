import { getRecoveryStatus } from '@/api/Workout';
import { MuscleRecoveryItem, RecoveryStatusResponse } from '@/api/types';
import { CNSRecoveryItem } from '@/api/types/workout';
import UpgradePrompt from '@/components/UpgradePrompt';
import { theme, typographyStyles } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategory, getStatusColor, formatTimeRemaining } from '@/utils/recoveryStatusHelpers';
import RecoveryHeader from './components/RecoveryHeader';
import RecoveryLoadingSkeleton from './components/RecoveryLoadingSkeleton';

// Inline MuscleCard to debug
function MuscleCard({ muscle, data }: { muscle: string; data: MuscleRecoveryItem }) {
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
    <View style={muscleStyles.card}>
      <View style={muscleStyles.row}>
        <View style={muscleStyles.left}>
          <Text style={muscleStyles.muscleName}>{label}</Text>
          {sets > 0 && (
            <Text style={muscleStyles.setsLabel}>{sets} SETS LOGGED</Text>
          )}
        </View>
        <View style={muscleStyles.right}>
          <View style={muscleStyles.pctRow}>
            <Text style={[muscleStyles.pct, { color: accentColor }]}>{pct.toFixed(0)}</Text>
            <Text style={[muscleStyles.pctUnit, { color: accentColor }]}>%</Text>
          </View>
          {!isReady && (
            <View style={[muscleStyles.badge, { backgroundColor: badgeBg, borderColor: `${accentColor}25` }]}>
              <Text style={[muscleStyles.badgeText, { color: accentColor }]}>{timeDisplay}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={muscleStyles.track}>
        <View style={[muscleStyles.fill, { width: `${pct}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

// Inline CNSCard to debug
function CNSCard({ data }: { data: CNSRecoveryItem }) {
  const pct = Number(data.recovery_percentage);
  const color = getStatusColor(pct);
  const hoursLeft = Number(data.hours_until_recovery);
  const isReady = data.is_recovered || pct >= 90;
  const cnsLoad = Number(data.cns_load);

  const accentColor = isReady ? theme.colors.status.success : color;
  const badgeBg = `${accentColor}10`;

  return (
    <View style={cnsStyles.card}>
      <View style={cnsStyles.header}>
        <View style={[cnsStyles.iconContainer, { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}20` }]}>
          <Ionicons name="pulse" size={20} color={accentColor} />
        </View>
        <View style={cnsStyles.titleCol}>
          <Text style={cnsStyles.title}>CENTRAL NERVOUS SYSTEM</Text>
          <Text style={cnsStyles.subtitle}>{isReady ? 'RECOVERED' : 'STILL RECOVERING'}</Text>
        </View>
        <View style={[cnsStyles.statusBadge, { backgroundColor: badgeBg, borderColor: `${accentColor}25` }]}>
          <Text style={[cnsStyles.statusText, { color: accentColor }]}>
            {isReady ? 'READY' : formatTimeRemaining(hoursLeft)}
          </Text>
        </View>
      </View>

      <View style={cnsStyles.metricsRow}>
        <View style={cnsStyles.metricBlock}>
          <Text style={cnsStyles.metricLabel}>RECOVERY</Text>
          <View style={cnsStyles.metricValueRow}>
            <Text style={[cnsStyles.metricValue, { color: accentColor }]}>{pct.toFixed(0)}</Text>
            <Text style={[cnsStyles.metricUnit, { color: accentColor }]}>%</Text>
          </View>
        </View>
        {cnsLoad > 0 && (
          <View style={[cnsStyles.metricBlock, cnsStyles.metricBorder]}>
            <Text style={cnsStyles.metricLabel}>LOAD</Text>
            <View style={cnsStyles.metricValueRow}>
              <Text style={cnsStyles.metricValue}>{cnsLoad.toFixed(0)}</Text>
              <Text style={cnsStyles.metricUnit}>PTS</Text>
            </View>
          </View>
        )}
        {!isReady && (
          <View style={[cnsStyles.metricBlock, cnsStyles.metricBorder]}>
            <Text style={cnsStyles.metricLabel}>TO 100%</Text>
            <View style={cnsStyles.metricValueRow}>
              <Text style={cnsStyles.metricValue}>{Math.ceil(hoursLeft).toString()}</Text>
              <Text style={cnsStyles.metricUnit}>H</Text>
            </View>
          </View>
        )}
      </View>

      <View style={cnsStyles.track}>
        <View style={[cnsStyles.fill, { width: `${pct}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

export default function RecoveryStatusScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const isPro = user?.is_pro ?? false;
  const [statusMap, setStatusMap] = useState<Record<string, MuscleRecoveryItem>>({});
  const [cnsRecovery, setCnsRecovery] = useState<CNSRecoveryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res: RecoveryStatusResponse = await getRecoveryStatus();
      if (res?.recovery_status) {
        setStatusMap(res.recovery_status);
      }
      if (res?.cns_recovery) {
        const raw = res.cns_recovery;
        setCnsRecovery({
          ...raw,
          cns_load: Number(raw.cns_load),
          recovery_hours: Number(raw.recovery_hours),
          hours_until_recovery: Number(raw.hours_until_recovery),
          recovery_percentage: Number(raw.recovery_percentage),
        });
      }
    } catch (e) {
      logger.error('Failed to load recovery status', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const { stats, flattenedData } = useMemo(() => {
    const entries = Object.entries(statusMap);
    const total = entries.length;
    const recovered = entries.filter(([_, d]) => d.is_recovered || d.recovery_percentage >= 90).length;
    const sum = entries.reduce((acc, [_, d]) => acc + Number(d.recovery_percentage), 0);
    const avg = total > 0 ? sum / total : 0;
    const fatigued = entries.filter(([_, d]) => Number(d.recovery_percentage) < 50).length;

    const groups: Record<string, typeof entries> = {
      'Upper Body': [],
      'Lower Body': [],
      Core: [],
    };

    entries.forEach(([muscle, data]) => {
      const category = getCategory(muscle);
      groups[category].push([muscle, data]);
    });

    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => Number(a[1].recovery_percentage) - Number(b[1].recovery_percentage));
    });

    const flattened: Array<
      | { type: 'section'; category: string }
      | { type: 'muscle'; muscle: string; data: MuscleRecoveryItem }
    > = [];

    (['Upper Body', 'Lower Body', 'Core'] as const).forEach((category) => {
      const items = groups[category];
      if (items && items.length > 0) {
        flattened.push({ type: 'section', category });
        items.forEach(([muscle, data]) => {
          flattened.push({ type: 'muscle', muscle, data });
        });
      }
    });

    return {
      stats: { total, recovered, avg, fatigued },
      flattenedData: flattened,
    };
  }, [statusMap]);

  if (isLoading) {
    return <RecoveryLoadingSkeleton />;
  }

  const hasData = stats.total > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <RecoveryHeader />

      <FlatList
        data={flattenedData}
        keyExtractor={(item, index) =>
          item.type === 'section' ? `section-${item.category}` : `muscle-${item.muscle}-${index}`
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'muscle' ? <View style={styles.separator} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.status.active}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stats summary row */}
            {hasData && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>RECOVERED</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: theme.colors.status.success }]}>{stats.recovered}</Text>
                    <Text style={styles.statDenom}>/{stats.total}</Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>AVG STATUS</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: getStatusColor(stats.avg) }]}>{stats.avg.toFixed(0)}</Text>
                    <Text style={styles.statDenom}>%</Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>FATIGUED</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: stats.fatigued > 0 ? theme.colors.status.error : theme.colors.text.tertiary }]}>
                      {stats.fatigued}
                    </Text>
                    <Text style={styles.statDenom}> MG</Text>
                  </View>
                </View>
              </View>
            )}

            {/* System Recovery (CNS) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.indicator} />
                  <Text style={styles.sectionTitle}>SYSTEM STATUS</Text>
                </View>
              </View>
              {isPro ? (
                cnsRecovery ? (
                  <CNSCard data={cnsRecovery} />
                ) : null
              ) : (
                <UpgradePrompt
                  feature="CNS Recovery Tracking"
                  message="Track your Central Nervous System recovery to optimize training"
                />
              )}
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.indicator} />
                  <Text style={styles.sectionTitle}>{item.category.toUpperCase()}</Text>
                </View>
              </View>
            );
          }
          return <MuscleCard muscle={item.muscle} data={item.data} />;
        }}
        ListEmptyComponent={
          !hasData ? (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color={theme.colors.ui.border} />
              <Text style={styles.emptyText}>No recovery data yet.</Text>
              <Text style={styles.emptySub}>Complete a workout to start tracking muscle fatigue.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const muscleStyles = StyleSheet.create({
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

const cnsStyles = StyleSheet.create({
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
  content: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
  },
  // Stats summary row
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    gap: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  statDenom: {
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'normal',
    color: theme.colors.text.tertiary,
    marginLeft: 1,
  },
  // Sections
  section: {
    marginBottom: theme.spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    paddingHorizontal: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 3,
    height: 14,
    backgroundColor: theme.colors.status.active,
    borderRadius: 2,
  },
  sectionTitle: {
    ...typographyStyles.label,
    fontSize: 12,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  separator: {
    height: theme.spacing.s,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    ...typographyStyles.h3,
    fontSize: 16,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  emptySub: {
    ...typographyStyles.body,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 40,
  },
});
