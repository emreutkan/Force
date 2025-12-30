import { getWorkout, getWorkoutSummary } from '@/api/Workout';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutSummaryScreen() {
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const insets = useSafeAreaInsets();
    const [workout, setWorkout] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (workoutId) {
            fetchData();
        }
    }, [workoutId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [workoutData, summaryData] = await Promise.all([
                getWorkout(parseInt(workoutId)),
                getWorkoutSummary(parseInt(workoutId))
            ]);
            
            if (workoutData && typeof workoutData === 'object' && !workoutData.error) {
                setWorkout(workoutData);
            }
            
            if (summaryData && typeof summaryData === 'object' && !summaryData.error) {
                setSummary(summaryData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getTotalSets = () => {
        if (!workout?.exercises) return 0;
        return workout.exercises.reduce((total: number, exercise: any) => {
            return total + (exercise.sets?.length || 0);
        }, 0);
    };

    const getTotalVolume = () => {
        if (!workout?.exercises) return 0;
        return workout.exercises.reduce((total: number, exercise: any) => {
            const exerciseVolume = exercise.sets?.reduce((vol: number, set: any) => {
                return vol + ((set.weight || 0) * (set.reps || 0));
            }, 0) || 0;
            return total + exerciseVolume;
        }, 0);
    };

    const getScoreColor = (score: number): string => {
        if (score >= 8) return '#32D74B'; // Green
        if (score >= 6) return '#FF9F0A'; // Orange
        return '#FF3B30'; // Red
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <UnifiedHeader title="Workout Summary" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            </View>
        );
    }

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <UnifiedHeader title="Workout Summary" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load workout</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader title="Workout Summary" />
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingTop: 60 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Message */}
                <View style={styles.successCard}>
                    <View style={styles.successIconContainer}>
                        <Ionicons name="checkmark-circle" size={64} color="#32D74B" />
                    </View>
                    <Text style={styles.successTitle}>Workout Completed!</Text>
                    <Text style={styles.successSubtitle}>Great job finishing your workout</Text>
                </View>

                {/* Workout Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.cardTitle}>{workout.title || 'Untitled Workout'}</Text>
                    <Text style={styles.cardDate}>{formatDate(workout.date || workout.created_at)}</Text>
                </View>

                {/* Workout Score */}
                {summary && summary.score !== undefined && (
                    <View style={styles.scoreCard}>
                        <View style={styles.scoreHeader}>
                            <Text style={styles.scoreTitle}>Workout Score</Text>
                            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(summary.score) }]}>
                                <Text style={styles.scoreValue}>{summary.score.toFixed(1)}</Text>
                            </View>
                        </View>
                        <Text style={styles.scoreSubtitle}>
                            Based on recovery status and 1RM performance
                        </Text>
                    </View>
                )}

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Ionicons name="time-outline" size={24} color="#0A84FF" />
                        <Text style={styles.statValue}>{formatDuration(workout.duration || 0)}</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="barbell-outline" size={24} color="#FF9F0A" />
                        <Text style={styles.statValue}>{workout.exercises?.length || 0}</Text>
                        <Text style={styles.statLabel}>Exercises</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="repeat-outline" size={24} color="#32D74B" />
                        <Text style={styles.statValue}>{getTotalSets()}</Text>
                        <Text style={styles.statLabel}>Total Sets</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="trending-up-outline" size={24} color="#FF3B30" />
                        <Text style={styles.statValue}>{getTotalVolume().toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Total Volume</Text>
                    </View>
                </View>

                {/* Positives */}
                {summary && summary.positives && Object.keys(summary.positives).length > 0 && (
                    <View style={styles.analysisCard}>
                        <View style={styles.analysisHeader}>
                            <Ionicons name="checkmark-circle" size={20} color="#32D74B" />
                            <Text style={styles.analysisTitle}>Positives</Text>
                        </View>
                        {Object.entries(summary.positives).map(([key, item]: [string, any]) => (
                            <View key={key} style={styles.analysisItem}>
                                <View style={[styles.analysisDot, { backgroundColor: '#32D74B' }]} />
                                <Text style={styles.analysisText}>{item.message}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Negatives */}
                {summary && summary.negatives && Object.keys(summary.negatives).length > 0 && (
                    <View style={styles.analysisCard}>
                        <View style={styles.analysisHeader}>
                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                            <Text style={styles.analysisTitle}>Areas to Improve</Text>
                        </View>
                        {Object.entries(summary.negatives).map(([key, item]: [string, any]) => (
                            <View key={key} style={styles.analysisItem}>
                                <View style={[styles.analysisDot, { backgroundColor: '#FF3B30' }]} />
                                <Text style={styles.analysisText}>{item.message}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Neutrals */}
                {summary && summary.neutrals && Object.keys(summary.neutrals).length > 0 && (
                    <View style={styles.analysisCard}>
                        <View style={styles.analysisHeader}>
                            <Ionicons name="remove-circle" size={20} color="#8E8E93" />
                            <Text style={styles.analysisTitle}>Neutral</Text>
                        </View>
                        {Object.entries(summary.neutrals).map(([key, item]: [string, any]) => (
                            <View key={key} style={styles.analysisItem}>
                                <View style={[styles.analysisDot, { backgroundColor: '#8E8E93' }]} />
                                <Text style={styles.analysisText}>{item.message}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Exercises Summary */}
                {workout.exercises && workout.exercises.length > 0 && (
                    <View style={styles.exercisesCard}>
                        <Text style={styles.sectionTitle}>Exercises</Text>
                        {workout.exercises.map((exercise: any, index: number) => {
                            const exerciseName = exercise.exercise?.name || exercise.name || 'Unknown Exercise';
                            const sets = exercise.sets || [];
                            const totalVolume = sets.reduce((vol: number, set: any) => {
                                return vol + ((set.weight || 0) * (set.reps || 0));
                            }, 0);

                            return (
                                <View key={exercise.id || index} style={styles.exerciseItem}>
                                    <View style={styles.exerciseHeader}>
                                        <Text style={styles.exerciseName}>{exerciseName}</Text>
                                        <Text style={styles.exerciseSets}>{sets.length} sets</Text>
                                    </View>
                                    <View style={styles.exerciseStats}>
                                        <View style={styles.exerciseStat}>
                                            <Text style={styles.exerciseStatValue}>{totalVolume.toLocaleString()}</Text>
                                            <Text style={styles.exerciseStatLabel}>Volume</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(home)')}
                    >
                        <Text style={styles.primaryButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push(`/(workouts)/${workout.id}`)}
                    >
                        <Text style={styles.secondaryButtonText}>View Details</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
    },
    successCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 32,
        marginHorizontal: 16,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    successSubtitle: {
        color: '#8E8E93',
        fontSize: 16,
    },
    infoCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    cardDate: {
        color: '#8E8E93',
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: 16,
        marginBottom: 24,
        gap: 16,
    },
    statCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        flex: 1,
        minWidth: '45%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '400',
    },
    exercisesCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    exerciseItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
    },
    exerciseSets: {
        color: '#8E8E93',
        fontSize: 13,
    },
    exerciseStats: {
        flexDirection: 'row',
        gap: 24,
    },
    exerciseStat: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    exerciseStatValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    exerciseStatLabel: {
        color: '#8E8E93',
        fontSize: 13,
    },
    actionsContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    scoreCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    scoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    scoreBadge: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    scoreValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    scoreSubtitle: {
        color: '#8E8E93',
        fontSize: 13,
    },
    analysisCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        marginHorizontal: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    analysisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    analysisTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    analysisItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    analysisDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    analysisText: {
        color: '#FFFFFF',
        fontSize: 15,
        flex: 1,
        lineHeight: 22,
    },
});

