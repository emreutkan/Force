import { CheckTodayResponse, Workout } from '@/api/types';
import TrainingIntensityCard from '@/components/TrainingIntensityCard';
import { RestDayCard } from '@/components/WorkoutModal';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { RefObject } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

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

interface ActiveSectionProps {
    activeWorkout: Workout | null;
    elapsedTime: string;
    onDeleteWorkout: (id: number, isActive: boolean) => void;
    todayStatus: CheckTodayResponse | null;
    todayWorkoutScore: number | null;
    startButtonRef: RefObject<View | null>;
    onStartWorkoutPress: () => void;
}

export default function ActiveSection({
    activeWorkout,
    elapsedTime,
    onDeleteWorkout,
    todayStatus,
    todayWorkoutScore,
    startButtonRef,
    onStartWorkoutPress,
}: ActiveSectionProps) {
    if (activeWorkout) {
        return (
            <ReanimatedSwipeable renderRightActions={(p, d) => <SwipeAction progress={p} onPress={() => onDeleteWorkout(activeWorkout.id, true)} />}>
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
            onPress={onStartWorkoutPress}
            activeOpacity={0.8}
        >
            <View style={styles.upperSection}>
                <View style={styles.upperLeft}>
                    <View style={styles.intensityHeader}>
                        <View style={styles.intensityBars}>
                            {[0.3, 0.5, 0.7].map((opacity, index) => (
                                <View 
                                    key={index} 
                                    style={[styles.bar, { opacity }]} 
                                />
                            ))}
                        </View>
                        <Text style={styles.intensityLabel}>START WORKOUT</Text>
                    </View>
                    <View style={styles.intensityTextContainer}>
                        <Text style={styles.intensitySubtitle}>Tap to begin your session</Text>
                    </View>
                </View>
                <View style={styles.intensityIcon}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.colors.status.active} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    activeCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.l, 
        padding: theme.spacing.s, 
        marginBottom: theme.spacing.s, 
        borderWidth: 0.5, 
        borderColor: theme.colors.ui.border 
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: theme.spacing.s 
    },
    liveBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(52, 211, 153, 0.1)', 
        paddingHorizontal: 6, 
        paddingVertical: 4, 
        borderRadius: 6, 
        gap: 6 
    },
    liveText: { 
        color: theme.colors.status.success, 
        fontSize: theme.typography.sizes.s, 
        fontWeight: '700' 
    },
    timerText: { 
        color: theme.colors.status.active, 
        fontSize: theme.typography.sizes.m, 
        fontVariant: ['tabular-nums'], 
        fontWeight: '600' 
    },
    activeTitle: { 
        fontSize: theme.typography.sizes.xl, 
        fontWeight: '700', 
        color: theme.colors.text.primary, 
        marginBottom: theme.spacing.s 
    },
    deleteAction: { 
        backgroundColor: theme.colors.status.error, 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: 80, 
        height: '100%', 
        borderRadius: theme.borderRadius.l, 
        marginLeft: theme.spacing.s 
    },
    startCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.xxl, 
        padding: theme.spacing.xxl, 
        marginBottom: theme.spacing.m, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        shadowColor: theme.colors.ui.brandGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    upperSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    upperLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
        gap: theme.spacing.s,
    },
    intensityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    intensityBars: {
        flexDirection: 'row',
        gap: 4,
    },
    bar: {
        width: 4,
        height: 12,
        borderRadius: 2,
        backgroundColor: theme.colors.status.active,
    },
    intensityTextContainer: {
        flex: 1,
    },
    intensityLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    intensitySubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    intensityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.ui.primaryLight,
        borderWidth: 1,
        borderColor: theme.colors.ui.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

