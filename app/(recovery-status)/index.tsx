import { getRecoveryStatus } from '@/api/Workout';
import { CNSRecovery, MuscleRecovery, RecoveryStatusResponse } from '@/api/types';
import UpgradePrompt from '@/components/UpgradePrompt';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. HELPERS & CONFIG
// ============================================================================

const formatTimeRemaining = (hours: number): string => {
    if (hours <= 0) return 'Ready';
    if (hours < 1) return `${Math.ceil(hours * 60)}m`;
    if (hours < 24) return `${Math.ceil(hours)}h`;
    const days = Math.floor(hours / 24);
    const h = Math.ceil(hours % 24);
    return h > 0 ? `${days}d ${h}h` : `${days}d`;
};

const getStatusColor = (pct: number) => {
    if (pct >= 90) return '#30D158'; // Green (Ready)
    if (pct >= 50) return '#FF9F0A'; // Orange (Recovering)
    return '#FF453A'; // Red (Fatigued)
};

const MUSCLE_CATEGORIES = {
    Upper: ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'traps', 'lower_back', 'neck'],
    Lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
    Core: ['abs', 'obliques']
};

const getCategory = (muscle: string) => {
    if (MUSCLE_CATEGORIES.Upper.includes(muscle)) return 'Upper Body';
    if (MUSCLE_CATEGORIES.Lower.includes(muscle)) return 'Lower Body';
    return 'Core';
};

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function RecoveryStatusScreen() {
    const insets = useSafeAreaInsets();
    
    // --- State ---
    const [statusMap, setStatusMap] = useState<Record<string, MuscleRecovery>>({});
    const [cnsRecovery, setCnsRecovery] = useState<CNSRecovery | null>(null);
    const [isPro, setIsPro] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- Data ---
    const loadData = async () => {
        try {
            const res: RecoveryStatusResponse = await getRecoveryStatus();
            if (res?.recovery_status) {
                setStatusMap(res.recovery_status);
            }
            if (res?.cns_recovery) {
                setCnsRecovery(res.cns_recovery);
            }
            if (res?.is_pro !== undefined) {
                setIsPro(res.is_pro);
            }
        } catch (e) {
            console.error(e);
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

    // --- Stats Calculation ---
    const { stats, groupedData } = useMemo(() => {
        const entries = Object.entries(statusMap);
        const total = entries.length;
        
        // Initialize groups with proper type structure
        const groups: Record<string, typeof entries> = {
            'Upper Body': [], 'Lower Body': [], 'Core': []
        };
        
        if (total === 0) return { stats: null, groupedData: groups };

        let recovered = 0;
        let recovering = 0;
        let totalPct = 0;

        entries.forEach(([m, s]) => {
            if (s.is_recovered) recovered++; else recovering++;
            totalPct += Number(s.recovery_percentage);
            
            const cat = getCategory(m);
            groups[cat].push([m, s]);
        });

        // Sort groups: Recovering first (lowest %), then alphabetical
        Object.keys(groups).forEach(key => {
            groups[key].sort(([, a], [, b]) => {
                const pctA = Number(a.recovery_percentage);
                const pctB = Number(b.recovery_percentage);
                if (Math.abs(pctA - pctB) > 5) return pctA - pctB; // Low % first
                return 0;
            });
        });

        return {
            stats: {
                recovered,
                recovering,
                avg: Math.round(totalPct / total)
            },
            groupedData: groups
        };
    }, [statusMap]);

    // --- Renderers ---

    const renderCNSCard = (data: CNSRecovery) => {
        const pct = Number(data.recovery_percentage);
        const color = getStatusColor(pct);
        const hoursLeft = Number(data.hours_until_recovery);
        const isReady = data.is_recovered || pct >= 90;

        return (
            <View style={[styles.card, styles.cnsCard, !isReady && styles.cardActive]} key="cns">
                <View style={styles.cardHeader}>
                    <View style={styles.nameContainer}>
                        <Ionicons name="pulse" size={16} color={color} />
                        <Text style={styles.muscleName}>Central Nervous System</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: isReady ? 'rgba(48,209,88,0.1)' : 'rgba(255,159,10,0.1)' }]}>
                        <Text style={[styles.badgeText, { color: isReady ? '#30D158' : '#FF9F0A' }]}>
                            {isReady ? 'Ready' : formatTimeRemaining(hoursLeft)}
                        </Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.pctText}>{pct.toFixed(0)}% Recovered</Text>
                    {!isReady && data.cns_load > 0 && (
                        <View style={styles.fatigueRow}>
                            <Ionicons name="flash" size={12} color="#8E8E93" />
                            <Text style={styles.fatigueText}>Load: {data.cns_load.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderMuscleCard = (muscle: string, data: MuscleRecovery) => {
        const pct = Number(data.recovery_percentage);
        const color = getStatusColor(pct);
        const hoursLeft = Number(data.hours_until_recovery);
        const isReady = data.is_recovered || pct >= 90;

        // Format time for display (e.g., "4H", "36H")
        let timeDisplay = 'Ready';
        if (!isReady && hoursLeft > 0) {
            if (hoursLeft < 1) {
                const minutes = Math.ceil(hoursLeft * 60);
                timeDisplay = `${minutes}M`;
            } else if (hoursLeft < 24) {
                timeDisplay = `${Math.ceil(hoursLeft)}H`;
            } else {
                const days = Math.floor(hoursLeft / 24);
                const hours = Math.ceil(hoursLeft % 24);
                timeDisplay = hours > 0 ? `${days}D ${hours}H` : `${days}D`;
            }
        }

        return (
            <View style={styles.card} key={muscle}>
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.muscleName}>{muscle.replace(/_/g, ' ').toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        <Text style={styles.percentageText}>{pct.toFixed(0)}%</Text>
                        <Text style={styles.timeText}>{timeDisplay}</Text>
                    </View>
                </View>
                <View style={styles.progressContainer}>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${pct}%` }]} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l }}>
                <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={typographyStyles.h2}>RECOVERY</Text>
                    <Text style={[typographyStyles.labelMuted, { marginTop: theme.spacing.xs, color: theme.colors.text.brand }]}>REAL-TIME TRACKING </Text>
                </View>
            </View>
        

            {isLoading ? (
                <View style={[styles.center]}>
                    <ActivityIndicator size="large" color={theme.colors.status.active} />
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.status.active} />}
                >
         

                    <View style={styles.section }>
                        <Text style={styles.sectionTitle}>System Recovery</Text>
                        {cnsRecovery ? (
                            !cnsRecovery.is_recovered && cnsRecovery.cns_load > 0 && renderCNSCard(cnsRecovery)
                        ) : (
                            <UpgradePrompt
                                feature="CNS Recovery Tracking"
                                message="Track your Central Nervous System recovery to optimize training"
                            />
                        )}
                    </View>

                    {(['Upper Body', 'Lower Body', 'Core'] as const).map(category => {
                        const items = groupedData[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <View key={category} style={styles.section}>
                                <Text style={styles.sectionTitle}>{category}</Text>
                                <View style={styles.grid}>
                                    {items.map(([m, data]) => renderMuscleCard(m, data))}
                                </View>
                            </View>
                        );
                    })}

                    {(!stats || stats.avg === 0 && stats.recovered === 0) && (
                        <View style={styles.emptyState}>
                            <Ionicons name="fitness-outline" size={64} color={theme.colors.ui.border} />
                            <Text style={styles.emptyText}>No recovery data available.</Text>
                            <Text style={styles.emptySub}>Complete workouts to track muscle fatigue.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: theme.spacing.m,
    },

    // Dashboard
    dashboard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        marginBottom: theme.spacing.xxl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,    
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        letterSpacing: theme.typography.tracking.labelTight,
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.colors.ui.border,
        height: '80%',
        alignSelf: 'center',
    },

    // Section
    section: {
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.zinc600,
        marginBottom: theme.spacing.s,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    
    // Grid/List
    grid: {
        gap: theme.spacing.s,
    },

    // Card
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        marginBottom: theme.spacing.s,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.m,
    },
    iconSquare: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.m,
    },
    nameContainer: {
        flex: 1,
    },
    muscleName: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    cardRight: {
        alignItems: 'flex-end',
    },
    percentageText: {
        ...typographyStyles.h2,
    },
    timeText: {
        ...typographyStyles.labelMuted,
    },
    cnsCard: {
        borderWidth: 2,
        borderColor: theme.colors.ui.border,
    },
    cardActive: {
        borderColor: theme.colors.ui.border,
        backgroundColor: theme.colors.ui.glass,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    indicatorDot: { width: 8, height: 8, borderRadius: 4 },
    
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 12, fontWeight: '600' },

    // Progress Bar
    progressContainer: {
        marginTop: theme.spacing.s,
    },
    track: {
        height: 6,
        backgroundColor: theme.colors.ui.progressBg,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: theme.colors.status.active, // Bright blue
        borderRadius: theme.borderRadius.full,
    },

    // Footer
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pctText: { color: theme.colors.text.secondary, fontSize: 13, fontWeight: '500' },
    fatigueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fatigueText: { color: theme.colors.text.secondary, fontSize: 12 },

    // Empty
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '600',
        marginTop: theme.spacing.m,
    },
    emptySub: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.s,
        marginTop: 4,
    },
});