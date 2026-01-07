import { getActiveWorkout } from "@/api/Workout";
import WorkoutModal from "@/components/WorkoutModal";
import { commonStyles, theme, typographyStyles } from "@/constants/theme";
import { useWorkoutStore } from "@/state/userStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================================================
// 1. MAIN SCREEN
// ============================================================================

export default function Workouts() {
    const { workouts, isLoading, isLoadingMore, hasMore, fetchWorkouts, loadMoreWorkouts } = useWorkoutStore();
    const insets = useSafeAreaInsets();
    
    // State
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    // --- Data Loading ---
    const fetchActive = async () => {
        try {
            const workout = await getActiveWorkout();
            if (workout && typeof workout === 'object' && 'id' in workout) {
                setActiveWorkout(workout);
            } else {
                setActiveWorkout(null);
            }
        } catch (error) { setActiveWorkout(null); }
    };

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                await fetchActive();
                await fetchWorkouts(true);
            };
            load();
        }, [fetchWorkouts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchActive(), fetchWorkouts(true)]);
        setRefreshing(false);
    }, [fetchWorkouts]);

    // --- Formatters & Sorters ---
    const sortedWorkouts = useMemo(() => {
        const activeId = activeWorkout?.id;
        return [...workouts]
            .filter(w => w.id !== activeId)
            .sort((a, b) => new Date(b.datetime || b.created_at).getTime() - new Date(a.datetime || a.created_at).getTime());
    }, [workouts, activeWorkout]);


    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    };

    const formatVolume = (volume: number) => {
        if (!volume || volume === 0) return '0KG';
        // Format with commas for thousands, then add KG
        const formatted = Math.round(volume).toLocaleString('en-US');
        return `${formatted}KG`;
    };

    // --- Modal Handlers ---
    const handleModalSuccess = async () => {
        await fetchWorkouts(true);
    };

    // --- RENDER ITEMS ---

    const renderWorkoutCard = ({ item, isActive = false }: { item: any, isActive?: boolean }) => {
        const volume = item.total_volume || 0;
        const dateStr = item.datetime || item.created_at;
        const exercises = item.exercises || [];
        const isRestDay = item.is_rest_day;

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
                    </View>
                    {!isRestDay && (
                        <View style={styles.cardTopRight}>
                            <Text style={styles.volumeLabel}>VOLUME</Text>
                            <Text style={styles.volumeValue}>{formatVolume(volume)}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.workoutTitle} numberOfLines={1}>
                    {isRestDay ? 'rest day' : (item.title || 'Untitled Workout')}
                </Text>

                {!isRestDay && exercises.length > 0 && (
                    <View style={styles.exercisesList}>
                        {exercises.slice(0, 3).map((exercise: any, index: number) => {
                            const setsCount = exercise.sets?.length || 0;
                            return (
                                <View key={exercise.id || index} style={styles.exerciseRow}>
                                    <Text style={styles.exerciseName}>{exercise.exercise?.name || exercise.name || 'Unknown'}</Text>
                                    <Text style={styles.exerciseSets}>{setsCount} SETS</Text>
                                </View>
                            );
                        })}
                        {exercises.length > 3 && (
                            <Text style={styles.moreExercises}>+{exercises.length - 3} more exercises</Text>
                        )}
                    </View>
                )}

                {!isRestDay && (
                    <TouchableOpacity 
                        style={styles.viewDetailButton}
                        onPress={() => router.push(`/(workouts)/${item.id}`)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewDetailText}>VIEW DETAIL</Text>
                        <Ionicons name="arrow-up" size={16} color={theme.colors.status.active} style={{ transform: [{ rotate: '45deg' }] }} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
                </TouchableOpacity>
                <Text style={typographyStyles.h2}>RECORDS</Text>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.status.active} />
                </View>
            ) : (
                <FlatList
                    data={sortedWorkouts}
                    renderItem={(props) => renderWorkoutCard(props)}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.status.active} />
                    }
                    ListEmptyComponent={!isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="barbell" size={64} color={theme.colors.ui.border} />
                            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
                            <Text style={styles.emptyText}>Start a new workout to track your progress.</Text>
                        </View>
                    ) : null}
                    onEndReached={() => { if(hasMore && !isLoadingMore) loadMoreWorkouts(); }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{padding: 20}} color={theme.colors.status.active} /> : null}
                />
            )}


            <WorkoutModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                mode="log"
                onSuccess={handleModalSuccess}
            />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.l,
        paddingBottom: theme.spacing.m,
    },
    listContent: {
        padding: theme.spacing.m,
        paddingTop: 0,
    },

    // Cards
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.m,
    },
    cardTopLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    dateText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
    },
    cardTopRight: {
        alignItems: 'flex-end',
    },
    volumeLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: 4,
    },
    volumeValue: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '800',
        color: theme.colors.status.active,
    },
    workoutTitle: {
        ...typographyStyles.h3,
        marginBottom: theme.spacing.m,
    },
    exercisesList: {
        marginBottom: theme.spacing.m,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    exerciseName: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '500',
        color: theme.colors.text.secondary,
        flex: 1,
    },
    exerciseSets: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
    },
    moreExercises: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.tertiary,
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
    viewDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.s,
    },
    viewDetailText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '700',
        color: theme.colors.status.active,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxxxxl,
    },
    emptyTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    emptyText: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
    },
});     