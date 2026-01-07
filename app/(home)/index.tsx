import { healthService } from '@/api/Health';
import { CalendarDay, CalendarStats, CheckTodayResponse, CNSRecovery, MuscleRecovery, TemplateWorkout, Workout } from '@/api/types';
import { checkToday, createWorkout, deleteWorkout, getActiveWorkout, getCalendar, getCalendarStats, getRecoveryStatus, getTemplateWorkouts, getWorkouts, getWorkoutSummary, startTemplateWorkout } from '@/api/Workout';
import MuscleRecoverySection from '@/components/MuscleRecoverySection';
import WorkoutModal, { RestDayCard, TrainingIntensityCard } from '@/components/WorkoutModal';
import { theme, typographyStyles } from '@/constants/theme';
import { useHomeLoadingStore, useWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView as RNScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Easing, Extrapolation, interpolate, SharedValue, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. ANIMATED COMPONENTS
// ============================================================================

interface SwipeActionProps {
    progress: SharedValue<number>;
    onPress: () => void;
}

const SwipeAction = ({ progress, onPress }: SwipeActionProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={24} color={theme.colors.text.primary} />
            </Animated.View>
        </TouchableOpacity>
    );
};

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
    const screenWidth = Dimensions.get('window').width;
    
    // --- Store & State ---
    const { workouts } = useWorkoutStore();
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

    const fetchAvailableYears = async () => {
        try {
            // For now, generate years from current year back 5 years
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
            setAvailableYears(years);
        } catch (error) {
            setAvailableYears([new Date().getFullYear()]);
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
    // 4. CALCULATIONS
    // ========================================================================

    // Calculate training intensity metrics
    const trainingMetrics = useMemo(() => {
        // Readiness score from CNS recovery
        const readinessScore = cnsRecovery?.recovery_percentage ?? 0;

        // Calculate total volume from recent workouts (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCompletedWorkouts = recentWorkouts.filter(w => {
            if (!w.is_done || !w.total_volume) return false;
            const workoutDate = new Date(w.datetime);
            return workoutDate >= thirtyDaysAgo;
        });

        const totalVolume = recentCompletedWorkouts.reduce((sum, w) => {
            return sum + (w.total_volume || 0);
        }, 0);

        // Calculate progress (compare current week vs previous week)
        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        
        const currentWeekWorkouts = recentWorkouts.filter(w => {
            if (!w.is_done || !w.total_volume) return false;
            const workoutDate = new Date(w.datetime);
            return workoutDate >= currentWeekStart && workoutDate < now;
        });
        
        const previousWeekWorkouts = recentWorkouts.filter(w => {
            if (!w.is_done || !w.total_volume) return false;
            const workoutDate = new Date(w.datetime);
            return workoutDate >= previousWeekStart && workoutDate < currentWeekStart;
        });

        const currentWeekVolume = currentWeekWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0);
        const previousWeekVolume = previousWeekWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0);

        let progress = 0;
        if (previousWeekVolume > 0) {
            progress = ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100;
        } else if (currentWeekVolume > 0) {
            progress = 100; // New activity
        }

        return {
            readinessScore,
            totalVolume,
            progress,
        };
    }, [cnsRecovery, recentWorkouts]);

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

    const renderActiveSection = () => {
        if (activeWorkout) {
        return (
                <ReanimatedSwipeable renderRightActions={(p, d) => <SwipeAction progress={p} onPress={() => handleDeleteWorkout(activeWorkout.id, true)} />}>
                    <TouchableOpacity style={styles.activeCard} onPress={() => router.push('/(active-workout)')} activeOpacity={0.9}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.liveBadge}>
                                <Text style={styles.liveText}>ACTIVE</Text>
                                    </View>
                                        <Text style={styles.timerText}>{elapsedTime}</Text>
                                    </View>
                        <Text style={styles.activeTitle} numberOfLines={1}>{activeWorkout.title}</Text>
     
                    </TouchableOpacity>
                </ReanimatedSwipeable>
            );
        }

        // Check for rest day first (priority)
        if (todayStatus && typeof todayStatus === 'object' && todayStatus !== null && 'workout' in todayStatus && todayStatus.workout && typeof todayStatus.workout === 'object' && 'is_rest_day' in todayStatus.workout && todayStatus.workout.is_rest_day) {
            const w = todayStatus.workout;
            return (
                <TouchableOpacity 
                    onPress={() => router.push(`/(workouts)/${w.id}`)} 
                    activeOpacity={0.9}
                >
                    <RestDayCard title={w.title} />
                </TouchableOpacity>
            );
        }
        
        // Also check if rest day is set directly on todayStatus (fallback)
        if (todayStatus && typeof todayStatus === 'object' && todayStatus !== null && 'is_rest' in todayStatus && todayStatus.is_rest) {
            return (
                <TouchableOpacity 
                    onPress={() => router.push('/(workouts)')} 
                    activeOpacity={0.9}
                >
                    <RestDayCard />
                </TouchableOpacity>
            );
        }

        // Check for completed workout - Show TrainingIntensityCard instead
        if (todayStatus && typeof todayStatus === 'object' && todayStatus !== null && 'workout_performed' in todayStatus && todayStatus.workout_performed && 'workout' in todayStatus && todayStatus.workout) {
            const w = todayStatus.workout;
            return (
                <TouchableOpacity 
                    onPress={() => router.push(`/(workouts)/${w.id}`)} 
                    activeOpacity={0.9}
                >
                    <TrainingIntensityCard
                        intensityScore={todayWorkoutScore ?? 0}
                        totalVolume={w.total_volume || 0}
                        caloriesBurned={Number(w.calories_burned || 0)}
                    />
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity 
                ref={startButtonRef}
                style={styles.startCard} 
                onPress={() => {
                    startButtonRef.current?.measure((x, y, w, h, px, py) => {
                        setMenuLayout({ x: px, y: py + h + 8, width: w });
                        setShowStartMenu(true);
                    });
                }}
                activeOpacity={0.8}
            >
                <View style={styles.startCardContent}>
                    <View style={styles.startCardLeft}>
                        <View style={styles.startIntensityBars}>
                            {[0.3, 0.5, 0.7].map((opacity, index) => (
                                <View 
                                    key={index} 
                                    style={[styles.startBar, { opacity }]} 
                                />
                            ))}
                        </View>
                        <View style={styles.startTextContainer}>
                            <Text style={styles.startLabel}>START WORKOUT</Text>
                            <Text style={styles.startSubtitle}>Tap to begin your session</Text>
                        </View>
                    </View>
                    <View style={styles.startIcon}>
                        <Ionicons name="add-circle-outline" size={24} color={theme.colors.status.active} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCalendarStrip = () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday
        
        // Get current week number and month
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const currentMonth = monthNames[today.getMonth()];
        const weekNumber = Math.ceil((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay()) / 7);
        
        return (
            <View style={styles.calendarStrip}>
                {/* Header */}
                <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>TIMELINE</Text>
                    <Text style={styles.calendarWeek}>{currentMonth} WEEK {weekNumber.toString().padStart(2, '0')}</Text>
                </View>
                
                {/* Days Row */}
                <View style={styles.calendarRow}>
                    {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(startOfWeek);
                        d.setDate(d.getDate() + i);
                        const isToday = d.toDateString() === today.toDateString();
                        const dateStr = d.toISOString().split('T')[0];
                        const dayData = calendarData.find(cd => cd.date === dateStr);
                        const hasActivity = dayData?.has_workout || dayData?.is_rest_day;
                        
                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.dayCell, isToday && styles.dayCellActive]}
                                onPress={() => setShowCalendarModal(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayName, isToday && styles.dayNameActive]}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3)}
                                </Text>
                                <Text style={[styles.dayDate, isToday && styles.dayDateActive]}>
                                    {d.getDate().toString().padStart(2, '0')}
                                </Text>
                                <View style={styles.dayDotContainer}>
                                    {hasActivity && (
                                        <View style={[
                                            styles.dayDot, 
                                            isToday ? styles.dayDotActive : (dayData?.has_workout ? styles.dayDotWorkout : styles.dayDotRest)
                                        ]} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
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
                <RNScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.status.active} />}
            >
                {/* FORCE Title */}
                <View style={styles.forceHeader}>
                    <Text style={typographyStyles.h1}>
                        FORCE
                        <Text style={{ color: theme.colors.status.active }}>.</Text>
                    </Text>
                         {/* Header Date */}
                <View style={styles.header}>
                    <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                                </View>
                </View>

           

            
                {/* 1. Active Workout or Start Button */}
                {renderActiveSection()}

                {/* 2. Calendar Strip */}
                {renderCalendarStrip()}

                {/* 3. Muscle Recovery Section */}
                <MuscleRecoverySection 
                    recoveryStatus={recoveryStatus}
                    onPress={() => router.push('/(recovery-status)')}
                />

                {/* 4. Steps Card */}
                {todaySteps !== null && (
                    <View style={styles.stepsCard}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="footsteps" size={16} color={theme.colors.status.active} />
                            <Text style={styles.metricTitle}>Steps</Text>
                        </View>
                        <Text style={styles.metricValue}>{todaySteps.toLocaleString()}</Text>
                    </View>
                )}

                {/* 4. Templates */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Templates</Text>
                    <TouchableOpacity onPress={() => router.push('/(templates)/create')}>
                        <Ionicons name="add-circle" size={24} color={theme.colors.status.active} />
                            </TouchableOpacity>
                </View>
                <RNScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateList}>
                    {templates.map(tpl => (
                        <TouchableOpacity 
                            key={tpl.id} 
                            style={styles.templateCard} 
                            onPress={() => {
                                startTemplateWorkout({ template_workout_id: tpl.id }).then(res => {
                                    if(res?.id) router.push('/(active-workout)');
                                });
                            }}
                        >
                            <View style={styles.templateIcon}>
                                <Text style={styles.templateIconText}>{tpl.title.charAt(0)}</Text>
                            </View>
                            <Text style={styles.templateName} numberOfLines={2}>{tpl.title}</Text>
                            <Text style={styles.templateCount}>{tpl.exercises.length} Exercises</Text>
                        </TouchableOpacity>
                    ))}
                </RNScrollView>
                
            </RNScrollView>

            {/* --- Start Workout Menu (Popover) --- */}
            {showStartMenu && (
                <>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowStartMenu(false)} />
                    <Animated.View style={[styles.popover, { top: menuLayout.y, left: menuLayout.x, width: menuLayout.width }]}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={80} tint="dark" style={styles.popoverBlur}>
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
                            </BlurView>
                        ) : (
                            <View style={styles.popoverAndroid}>
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
                        )}
                    </Animated.View>
                </>
            )}

            {/* --- Create Workout Modal --- */}
            <WorkoutModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mode={modalMode}
                onSuccess={handleModalSuccess}
            />

            {/* Calendar Modal */}
            <Modal
                visible={showCalendarModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendarModal(false)}
            >
                <View style={styles.calendarModalContainer}>
                    <View style={styles.calendarModalContent}>
                        <View style={styles.calendarModalHeader}>
                            <Text style={styles.calendarModalTitle}>Calendar</Text>
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {calendarStats && (
                    <View style={styles.weekStatsRow}>
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeLabel}>Workouts</Text>
                            <Text style={styles.statBadgeValue}>{calendarStats.total_workouts}</Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeLabel}>Rest Days</Text>
                            <Text style={styles.statBadgeValue}>{calendarStats.total_rest_days}</Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Text style={styles.statBadgeLabel}>Not Worked</Text>
                            <Text style={styles.statBadgeValue}>{calendarStats.days_not_worked}</Text>
                        </View>
                    </View>
                )}
                        {/* Year/Month Selector */}
                        <View style={styles.calendarControls}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth > 1) {
                                        setSelectedMonth(selectedMonth - 1);
                                        fetchCalendar(selectedYear, selectedMonth - 1);
                                        fetchCalendarStats(selectedYear, selectedMonth - 1);
                                    } else {
                                        setSelectedYear(selectedYear - 1);
                                        setSelectedMonth(12);
                                        fetchCalendar(selectedYear - 1, 12);
                                        fetchCalendarStats(selectedYear - 1, 12);
                                    }
                                }}
                                style={styles.calendarNavButton}
                            >
                                <Ionicons name="chevron-back" size={20} color={theme.colors.status.active} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    const yearsToShow = availableYears.length > 0 
                                        ? availableYears 
                                        : [new Date().getFullYear()];
                                    
                                    if (!yearsToShow.includes(selectedYear)) {
                                        yearsToShow.push(selectedYear);
                                        yearsToShow.sort((a, b) => b - a);
                                    }
                                    
                                    const yearOptions: Array<{ text: string; onPress?: () => void; style?: "cancel" | "default" | "destructive" }> = yearsToShow.map(year => ({
                                        text: year.toString(),
                                        onPress: () => {
                                            setSelectedYear(year);
                                            fetchCalendar(year, selectedMonth);
                                            fetchCalendarStats(year, selectedMonth);
                                        }
                                    }));
                                    yearOptions.push({ text: "Cancel", style: "cancel" });
                                    Alert.alert("Select Year", "", yearOptions);
                                }}
                                style={styles.calendarMonthYear}
                            >
                                <Text style={styles.calendarMonthYearText}>
                                    {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedMonth < 12) {
                                        setSelectedMonth(selectedMonth + 1);
                                        fetchCalendar(selectedYear, selectedMonth + 1);
                                        fetchCalendarStats(selectedYear, selectedMonth + 1);
                                    } else {
                                        setSelectedYear(selectedYear + 1);
                                        setSelectedMonth(1);
                                        fetchCalendar(selectedYear + 1, 1);
                                        fetchCalendarStats(selectedYear + 1, 1);
                                    }
                                }}
                                style={styles.calendarNavButton}
                            >
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.status.active} />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.calendarGridContainer}>
                            <View style={styles.calendarWeekHeader}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                    <View key={idx} style={styles.calendarDayHeader}>
                                        <Text style={styles.calendarDayHeaderText}>{day}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.calendarDaysGrid}>
                                {(() => {
                                    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
                                    const startDate = new Date(firstDay);
                                    startDate.setDate(startDate.getDate() - startDate.getDay());
                                    
                                    const days: React.ReactElement[] = [];
                                    const today = new Date();
                                    
                                    for (let i = 0; i < 42; i++) {
                                        const date = new Date(startDate);
                                        date.setDate(startDate.getDate() + i);
                                        const dateStr = date.toISOString().split('T')[0];
                                        const dayData = calendarData.find(d => d.date === dateStr);
                                        const isCurrentMonth = date.getMonth() === selectedMonth - 1;
                                        const isToday = date.toDateString() === today.toDateString();
                                        
                                        days.push(
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.calendarDayCell,
                                                    !isCurrentMonth && styles.calendarDayCellOtherMonth,
                                                    isToday && styles.calendarDayCellToday
                                                ]}
                                                onPress={() => handleCalendarDayClick(dateStr, dayData)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.calendarDayNumber,
                                                    !isCurrentMonth && styles.calendarDayNumberOtherMonth,
                                                    isToday && styles.calendarDayNumberToday
                                                ]}>
                                                    {date.getDate()}
                                                </Text>
                                                <View style={styles.calendarDayDots}>
                                                    {dayData?.has_workout && (
                                                        <View style={styles.calendarWorkoutDot} />
                                                    )}
                                                    {dayData?.is_rest_day && (
                                                        <View style={styles.calendarRestDayDot} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }
                                    return days;
                                })()}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
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

    // Active Card
    activeCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.s, marginBottom: theme.spacing.s, borderWidth: 0.5, borderColor: theme.colors.ui.border },
    completedCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.s, marginBottom: theme.spacing.s, borderWidth: 0.5, borderColor: theme.colors.ui.border, opacity: 0.8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.s },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 6 },
    completedBadge: { backgroundColor: 'rgba(192, 132, 252, 0.1)' },
    liveText: { color: theme.colors.status.success, fontSize: theme.typography.sizes.s, fontWeight: '700' },
    completedText: { color: theme.colors.status.rest, fontSize: theme.typography.sizes.s, fontWeight: '700' },
    timerText: { color: theme.colors.status.active, fontSize: theme.typography.sizes.m, fontVariant: ['tabular-nums'], fontWeight: '600' },
    activeTitle: { fontSize: theme.typography.sizes.xl, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.s },
    activeFooter: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    activeSubtext: { color: theme.colors.text.secondary, fontSize: theme.typography.sizes.s },
    deleteAction: { backgroundColor: theme.colors.status.error, justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: theme.borderRadius.l, marginLeft: theme.spacing.s },

    // Start Card
    startCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.l, 
        padding: theme.spacing.m, 
        marginBottom: theme.spacing.m, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        shadowColor: theme.colors.ui.brandGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    startCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    startCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.s,
    },
    startIntensityBars: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-end',
    },
    startBar: {
        width: 4,
        height: 12,
        borderRadius: 2,
        backgroundColor: theme.colors.status.active,
    },
    startTextContainer: {
        flex: 1,
    },
    startLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    startSubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    startIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.ui.primaryLight,
        borderWidth: 1,
        borderColor: theme.colors.ui.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Calendar Strip
    calendarStrip: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.l, 
        padding: theme.spacing.m, 
        marginBottom: theme.spacing.s, 
        borderWidth: 0.5, 
        borderColor: theme.colors.ui.border 
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    calendarTitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    calendarWeek: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '700',
        color: theme.colors.status.active,
        textTransform: 'uppercase',
    },
    calendarRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        gap: theme.spacing.xs,
    },
    dayCell: { 
        alignItems: 'center', 
        flex: 1,
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.xs,
        borderRadius: theme.borderRadius.m,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    dayCellActive: {
        backgroundColor: theme.colors.status.active,
    },
    dayName: { 
        fontSize: theme.typography.sizes.label,
        color: theme.colors.text.secondary, 
        marginBottom: theme.spacing.xs, 
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    dayNameActive: { 
        color: theme.colors.text.primary,
        fontWeight: '700',
    },
    dayDate: {
        fontSize: theme.typography.sizes.m,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    dayDateActive: {
        color: theme.colors.text.primary,
        fontWeight: '700',
    },
    dayDotContainer: {
        marginTop: theme.spacing.xs,
        height: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    dayDotActive: {
        backgroundColor: theme.colors.text.primary,
    },
    dayDotWorkout: {
        backgroundColor: theme.colors.status.active,
    },
    dayDotRest: {
        backgroundColor: theme.colors.text.tertiary,
    },

    // Metrics
    metricsRow: { flexDirection: 'row', gap: theme.spacing.s, marginBottom: theme.spacing.xl },
    metricCard: { flex: 1, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 0.5, borderColor: theme.colors.ui.border },
    stepsCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.m, borderWidth: 0.5, borderColor: theme.colors.ui.border, marginBottom: theme.spacing.m },
    metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.m },
    metricTitle: { fontSize: theme.typography.sizes.m, fontWeight: '600', color: theme.colors.text.primary },
    metricValue: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },
    recoveryList: { gap: theme.spacing.s },
    recoveryCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.l, 
        padding: theme.spacing.m, 
        borderWidth: 0.5, 
        borderColor: theme.colors.ui.border,
        marginBottom: theme.spacing.s,
    },
    recoveryCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    recoveryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.s },
    recoveryIcon: { marginRight: theme.spacing.xs },
    recoveryTextContainer: { flex: 1 },
    recoveryName: { fontSize: theme.typography.sizes.m, fontWeight: '600', color: theme.colors.text.primary, textTransform: 'capitalize', marginBottom: 4 },
    recoveryTimeText: { fontSize: theme.typography.sizes.xs, fontWeight: '500', color: theme.colors.text.secondary },
    recoveryRight: { alignItems: 'flex-end', minWidth: 60 },
    recoveryPctLarge: { fontSize: theme.typography.sizes.xl, fontWeight: '700', marginBottom: theme.spacing.xs },
    recoveryBar: { width: 60, height: 4, backgroundColor: theme.colors.ui.glassStrong, borderRadius: 2, overflow: 'hidden' },
    recoveryFill: { height: '100%', borderRadius: 2 },
    allRecovered: { fontSize: theme.typography.sizes.m, color: theme.colors.status.success, fontWeight: '600' },

    // Templates
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s, paddingHorizontal: theme.spacing.xs },
    sectionTitle: { fontSize: theme.typography.sizes.l, fontWeight: '700', color: theme.colors.text.primary },
    templateList: { paddingRight: theme.spacing.m, gap: theme.spacing.s },
    templateCard: { width: 140, height: 140, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l, padding: theme.spacing.s, justifyContent: 'space-between', borderWidth: 0.5, borderColor: theme.colors.ui.border },
    templateIcon: { width: 32, height: 32, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.ui.surfaceHighlight, alignItems: 'center', justifyContent: 'center' },
    templateIconText: { fontSize: theme.typography.sizes.m, fontWeight: '700', color: theme.colors.text.primary },
    templateName: { fontSize: theme.typography.sizes.s, fontWeight: '600', color: theme.colors.text.primary },
    templateCount: { fontSize: theme.typography.sizes.s, color: theme.colors.text.secondary },

    // Popover
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
    popover: { position: 'absolute', zIndex: 101, borderRadius: theme.borderRadius.m, overflow: 'hidden' },
    popoverBlur: { padding: 0 },
    popoverAndroid: { padding: 0, backgroundColor: theme.colors.ui.glassStrong, borderWidth: 1, borderColor: theme.colors.ui.border },
    popoverItem: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, gap: theme.spacing.s },
    popoverText: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.text.tertiary },

    // Skeleton
    skeletonContainer: { padding: theme.spacing.m, marginBottom: theme.spacing.m },
    skeletonCard: { width: '100%', height: 120, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.l },
    
    // Calendar Modal Styles
    calendarModalContainer: {
        flex: 1,
        backgroundColor: theme.colors.ui.glassStrong,
        justifyContent: 'flex-end'
    },
    calendarModalContent: {
        backgroundColor: theme.colors.ui.glass,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '90%',
        padding: theme.spacing.xl
    },
    calendarModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    calendarModalTitle: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700'
    },
    weekStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.xl,
    },
    statBadge: {
        alignItems: 'center'
    },
    statBadgeLabel: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.s,
        fontWeight: '300',
        marginBottom: theme.spacing.s
    },
    statBadgeValue: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '500'
    },
    calendarControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    calendarNavButton: {
        padding: theme.spacing.s
    },
    calendarMonthYear: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s
    },
    calendarMonthYearText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '500'
    },
    calendarGridContainer: {
        marginTop: theme.spacing.m
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: theme.spacing.m
    },
    calendarDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.s
    },
    calendarDayHeaderText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.s,
        fontWeight: '300'
    },
    calendarDaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    calendarDayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.s
    },
    calendarDayCellOtherMonth: {
        opacity: 0.3
    },
    calendarDayCellToday: {
        backgroundColor: theme.colors.ui.primaryLight,
        borderRadius: theme.borderRadius.m
    },
    calendarDayNumber: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '400'
    },
    calendarDayNumberOtherMonth: {
        color: theme.colors.text.secondary
    },
    calendarDayNumberToday: {
        color: theme.colors.status.active,
        fontWeight: '700'
    },
    calendarDayDots: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 2
    },
    calendarWorkoutDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.status.active
    },
    calendarRestDayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.status.rest
    },
});