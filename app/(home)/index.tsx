import { healthService } from '@/api/Health';
import { CalendarDay, CalendarStats, CheckTodayResponse, CNSRecovery, MuscleRecovery, TemplateWorkout, Workout } from '@/api/types';
import { checkToday, createWorkout, deleteWorkout, getActiveWorkout, getCalendar, getCalendarStats, getRecoveryStatus, getTemplateWorkouts, getWorkouts, getWorkoutSummary } from '@/api/Workout';
import ActiveSection from '@/components/ActiveSection';
import CalendarModal from '@/components/CalendarModal';
import CalendarStrip from '@/components/CalendarStrip';
import MuscleRecoverySection from '@/components/MuscleRecoverySection';
import TemplatesSection from '@/components/TemplatesSection';
import WorkoutModal from '@/components/WorkoutModal';
import { theme, typographyStyles } from '@/constants/theme';
import { useDateStore, useHomeLoadingStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView as RNScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. ANIMATED COMPONENTS
// ============================================================================


const LoadingSkeleton = ({ type = 'workout' }: { type?: 'workout' | 'recovery' }) => {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

        return (
        <View style={[styles.skeletonContainer, type === 'recovery' && { height: 100 }]}>
            <Animated.View style={[styles.skeletonCard, animatedStyle]} />
        </View>
    );
};

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function Home() {
    const insets = useSafeAreaInsets();
    
    // --- Store & State ---
    const today = useDateStore((state) => state.today);
    const { 
        isInitialLoadComplete, 
        todayStatus: cachedTodayStatus, 
        recoveryStatus: cachedRecoveryStatus,
        setInitialLoadComplete,
        setTodayStatus: setCachedTodayStatus,
        setRecoveryStatus: setCachedRecoveryStatus
    } = useHomeLoadingStore();

    // Data State
    const [todayStatus, setTodayStatus] = useState<CheckTodayResponse | null>(cachedTodayStatus);
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [recoveryStatus, setRecoveryStatus] = useState<Record<string, MuscleRecovery>>(cachedRecoveryStatus || {});
    const [cnsRecovery, setCnsRecovery] = useState<CNSRecovery | null>(null);
    const [templates, setTemplates] = useState<TemplateWorkout[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null);
    const [todaySteps, setTodaySteps] = useState<number | null>(null);
    const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
    const [todayWorkoutScore, setTodayWorkoutScore] = useState<number | null>(null);

    // UI State
    const [isLoading, setIsLoading] = useState(!isInitialLoadComplete);
    const [refreshing, setRefreshing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    
    // Modals & Inputs
    const [modalVisible, setModalVisible] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showStartMenu, setShowStartMenu] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'log'>('create');
    
    // Layout Refs
    const startButtonRef = useRef<View>(null);
    const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0 });

    // Calendar State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // ========================================================================
    // 3. DATA FETCHING
    // ========================================================================

    const fetchAllData = useCallback(async () => {
        try {
            const now = new Date();
            const currentWeek = getCurrentWeekNumber(now);

            // Parallel fetching for speed
            const [status, active, tpls, recovery, steps, cal, calStats, workoutsData] = await Promise.all([
                checkToday(),
                getActiveWorkout(),
                getTemplateWorkouts(),
                getRecoveryStatus(),
                fetchSteps(),
                getCalendar(now.getFullYear(), undefined, currentWeek),
                getCalendarStats(now.getFullYear(), undefined, currentWeek),
                getWorkouts(1, 50) // Get recent workouts for volume calculation
            ]);

            setTodayStatus(status);
            setCachedTodayStatus(status);
            
            if (active && typeof active === 'object' && 'id' in active) setActiveWorkout(active);
            else setActiveWorkout(null);

            setTemplates(Array.isArray(tpls) ? tpls : []);
            
            if (recovery?.recovery_status) {
                setRecoveryStatus(recovery.recovery_status);
                setCachedRecoveryStatus(recovery.recovery_status);
            }
            if (recovery?.cns_recovery) {
                setCnsRecovery(recovery.cns_recovery);
            }

            setTodaySteps(steps);
            setCalendarData(cal?.calendar || []);
            setCalendarStats(calStats);

            // Set recent workouts for volume calculation
            if (workoutsData && 'results' in workoutsData && Array.isArray(workoutsData.results)) {
                setRecentWorkouts(workoutsData.results);
            }

            // Fetch workout summary if today's workout exists
            if (status && typeof status === 'object' && 'workout_performed' in status && status.workout_performed && 'workout' in status && status.workout) {
                try {
                    const summary = await getWorkoutSummary((status.workout as Workout).id);
                    if (summary && typeof summary === 'object' && 'score' in summary && typeof summary.score === 'number') {
                        setTodayWorkoutScore(summary.score);
                    }
                } catch (e) {
                    console.error("Error fetching workout summary:", e);
                }
            } else {
                setTodayWorkoutScore(null);
            }

        } catch (e) {
            console.error("Home fetch error:", e);
        }
    }, []);

    const fetchSteps = async () => {
        try {
            const init = await healthService.initialize();
            return init ? await healthService.getTodaySteps() : null;
        } catch { return null; }
    };

    const getCurrentWeekNumber = (d: Date) => {
        const start = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
        return Math.ceil((days + start.getDay() + 1) / 7);
    };

    // Calendar helper functions
    const fetchCalendar = async (year: number, month?: number, week?: number) => {
        try {
            const result = await getCalendar(year, month, week);
            if (result?.calendar) {
                setCalendarData(result.calendar);
            }
        } catch (error) {
            console.error('Error fetching calendar:', error);
        }
    };

    const fetchCalendarStats = async (year: number, month?: number, week?: number) => {
        try {
            const result = await getCalendarStats(year, month, week);
            if (result) {
                setCalendarStats(result);
            }
        } catch (error) {
            console.error('Error fetching calendar stats:', error);
        }
    };


    // Initial Load
    useFocusEffect(
        useCallback(() => {
            if (!isInitialLoadComplete) {
                fetchAllData().then(() => {
                    setIsLoading(false);
                    setInitialLoadComplete(true);
                });
            } else {
                // Background refresh on focus - refresh templates too to prevent disappearing
                getActiveWorkout().then(w => {
                    if (w && typeof w === 'object' && 'id' in w) setActiveWorkout(w);
                    else setActiveWorkout(null);
                });
                checkToday().then(setTodayStatus);
                getTemplateWorkouts().then(tpls => {
                    setTemplates(Array.isArray(tpls) ? tpls : []);
                });
                fetchSteps().then(setTodaySteps);
            }
        }, [isInitialLoadComplete])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (activeWorkout?.created_at) {
            const start = new Date(activeWorkout.created_at).getTime();
            const tick = () => {
                const diff = Math.max(0, new Date().getTime() - start);
                const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                const m = Math.floor((diff / 60000) % 60).toString().padStart(2, '0');
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                setElapsedTime(`${h}:${m}:${s}`);
            };
            tick();
            interval = setInterval(tick, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeWorkout]);



    // ========================================================================
    // 5. ACTIONS
    // ========================================================================

    const handleModalSuccess = async () => {
        await fetchAllData();
    };

    const handleDeleteWorkout = async (id: number, isActive: boolean) => {
        Alert.alert("Delete Workout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                await deleteWorkout(id);
                if (isActive) setActiveWorkout(null);
                fetchAllData();
            }}
        ]);
    };

    const handleCalendarDayClick = async (dateStr: string, dayData: CalendarDay | undefined) => {
        if (!dayData) return;

        // If it's a rest day, show delete alert
        if (dayData.is_rest_day) {
            try {
                // Fetch workouts for this date to find the rest day workout ID
                const workoutsResponse = await getWorkouts();
                if (workoutsResponse && 'results' in workoutsResponse) {
                    const restDayWorkout = workoutsResponse.results.find((w: Workout) => {
                        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
                        return workoutDate === dateStr && w.is_rest_day;
                    });

                    if (restDayWorkout) {
                        Alert.alert("Delete Rest Day", "Do you want to delete this rest day?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: async () => {
                                await deleteWorkout(restDayWorkout.id);
                                fetchAllData();
                                fetchCalendar(selectedYear, selectedMonth);
                                fetchCalendarStats(selectedYear, selectedMonth);
                            }}
                        ]);
                    }
                }
            } catch (error) {
                console.error("Error fetching workout for rest day:", error);
            }
            return;
        }

        // If it's a regular workout, navigate to workout detail
        if (dayData.has_workout) {
            try {
                const workoutsResponse = await getWorkouts();
                if (workoutsResponse && 'results' in workoutsResponse) {
                    const workout = workoutsResponse.results.find((w: Workout) => {
                        const workoutDate = new Date(w.datetime).toISOString().split('T')[0];
                        return workoutDate === dateStr && !w.is_rest_day;
                    });

                    if (workout) {
                        router.push(`/(workouts)/${workout.id}`);
                    }
                }
            } catch (error) {
                console.error("Error fetching workout:", error);
            }
        }
    };

    // ========================================================================
    // 5. RENDER HELPERS
    // ========================================================================

    const handleStartWorkoutPress = () => {
        startButtonRef.current?.measure((x, y, w, h, px, py) => {
            setMenuLayout({ x: px, y: py + h + 8, width: w });
            setShowStartMenu(true);
        });
    };


    if (isLoading && !isInitialLoadComplete) {
                        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LoadingSkeleton />
                <LoadingSkeleton type="recovery" />
                                    </View>
                                        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
                <RNScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.status.active} />}
            >
                <View style={styles.forceHeader}>
                    <Text style={typographyStyles.h1}>
                        FORCE
                        <Text style={{ color: theme.colors.status.active }}>.</Text>
                    </Text>
                <View style={styles.header}>
                    <Text style={styles.headerDate}>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                                </View>
                </View>

           

            
                <ActiveSection
                    activeWorkout={activeWorkout}
                    elapsedTime={elapsedTime}
                    onDeleteWorkout={handleDeleteWorkout}
                    todayStatus={todayStatus}
                    todayWorkoutScore={todayWorkoutScore}
                    startButtonRef={startButtonRef}
                    onStartWorkoutPress={handleStartWorkoutPress}
                />

                <CalendarStrip 
                    calendarData={calendarData}
                    onPress={() => setShowCalendarModal(true)}
                />

                <MuscleRecoverySection 
                    recoveryStatus={recoveryStatus}
                    onPress={() => router.push('/(recovery-status)')}
                />

                {todaySteps !== null && (
                    <View style={styles.stepsCard}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="footsteps" size={16} color={theme.colors.status.active} />
                            <Text style={styles.metricTitle}>Steps</Text>
                        </View>
                        <Text style={styles.metricValue}>{todaySteps.toLocaleString()}</Text>
                    </View>
                )}

                <TemplatesSection templates={templates} />
                
            </RNScrollView>

            {showStartMenu && (
                <>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowStartMenu(false)} />
                    <Animated.View style={[styles.popover, { top: menuLayout.y, left: menuLayout.x, width: menuLayout.width }]}>
                        <View style={styles.popoverBlur}>
                            <TouchableOpacity style={styles.popoverItem} onPress={() => { setShowStartMenu(false); setModalMode('create'); setModalVisible(true); }}>
                                <Text style={styles.popoverText}>New Workout</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.popoverItem} onPress={() => { setShowStartMenu(false); setModalMode('log'); setModalVisible(true); }}>
                                <Text style={styles.popoverText}>Log Previous</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            <TouchableOpacity style={styles.popoverItem} onPress={async () => { 
                                setShowStartMenu(false); 
                                await createWorkout({ title: 'Rest Day', is_rest_day: true }); 
                                onRefresh();
                            }}>
                                <Text style={styles.popoverText}>Rest Day</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </>
            )}

            <WorkoutModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mode={modalMode}
                onSuccess={handleModalSuccess}
            />

            <CalendarModal
                visible={showCalendarModal}
                onClose={() => setShowCalendarModal(false)}
                calendarData={calendarData}
                calendarStats={calendarStats}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                availableYears={availableYears}
                onYearChange={(year) => {
                    setSelectedYear(year);
                    fetchCalendar(year, selectedMonth);
                    fetchCalendarStats(year, selectedMonth);
                }}
                onMonthChange={(year, month) => {
                    setSelectedYear(year);
                    setSelectedMonth(month);
                    fetchCalendar(year, month);
                    fetchCalendarStats(year, month);
                }}
                onDayClick={handleCalendarDayClick}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollContent: { padding: theme.spacing.s },
    
    // FORCE Header
    forceHeader: { 
        alignItems: 'flex-start', 
        marginBottom: theme.spacing.m,
        marginTop: theme.spacing.s,
    },
    
    // Header
    header: { marginBottom: theme.spacing.s },
    headerDate: { fontSize: theme.typography.sizes.xs, fontWeight: '600', color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: theme.typography.tracking.tight },

    stepsCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 0.5, borderColor: theme.colors.ui.border, marginBottom: theme.spacing.m },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.m },
    metricTitle: { fontSize: theme.typography.sizes.m, fontWeight: '600', color: theme.colors.text.primary },
    metricValue: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },


    // Popover
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
    popover: { position: 'absolute', zIndex: 101, borderRadius: theme.borderRadius.m, overflow: 'hidden' },
    popoverBlur: { padding: 0, backgroundColor: theme.colors.ui.glass, borderWidth: 1, borderColor: theme.colors.ui.border },
    popoverItem: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, gap: theme.spacing.s },
    popoverText: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.text.tertiary },

    // Skeleton
    skeletonContainer: { padding: theme.spacing.m, marginBottom: theme.spacing.m },
    skeletonCard: { width: '100%', height: 120, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l },
});