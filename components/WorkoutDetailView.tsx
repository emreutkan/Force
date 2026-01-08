import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RestTimerBar from './RestTimerBar';
import WorkoutDetailsView from './WorkoutDetailsView';
import WorkoutExerciseDetailsView from './WorkoutExerciseDetailsView';

// --- Main Component ---

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    isEditMode?: boolean;
    isViewOnly?: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
    onUpdateSet?: (setId: number, updatedSet: any) => void;
    onCompleteWorkout?: () => void;
    onShowStatistics?: (exerciseId: number) => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, isEditMode = false, isViewOnly = false, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet, onUpdateSet, onCompleteWorkout, onShowStatistics }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    const [exercises, setExercises] = useState(workout?.exercises || []);
    
    // Use global store for rest timer state (read-only, updated from backend)
    const { 
        lastSetTimestamp, 
        lastExerciseCategory
    } = useActiveWorkoutStore();

    // Move useRef to the top level, before any conditional returns
    const flatListRef = useRef<any>(null);

    useEffect(() => {
        if (workout?.exercises) {
            setExercises(workout.exercises);
        }
    }, [workout]);

    const handleAddSet = (exerciseId: number, data: any) => {
        // Backend handles rest timer state, just pass the data through
        onAddSet?.(exerciseId, data);
    };

    // Swipe Logic for closing swipeables
    const swipeableRefs = useRef<Map<string, any>>(new Map());
    const currentlyOpenSwipeable = useRef<string | null>(null);

    const closeCurrentSwipeable = useCallback(() => {
        if (currentlyOpenSwipeable.current) {
            const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
            ref?.close();
            currentlyOpenSwipeable.current = null;
        }
    }, []);

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    const handleInputFocus = (index: number) => {
        // This will be handled by WorkoutExerciseDetailsView
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            {isViewOnly && !isActive ? (
                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {!isEditMode && (
                        <WorkoutDetailsView 
                            workout={workout} 
                            elapsedTime={elapsedTime} 
                            isActive={isActive} 
                        />
                    )}
                    
                    <WorkoutExerciseDetailsView
                        workout={workout}
                        exercises={exercises}
                        setExercises={setExercises}
                        isActive={isActive}
                        isEditMode={isEditMode}
                        isViewOnly={isViewOnly}
                        onRemoveExercise={onRemoveExercise}
                        onAddSet={handleAddSet}
                        onDeleteSet={onDeleteSet}
                        onUpdateSet={onUpdateSet}
                        onShowStatistics={onShowStatistics}
                        onInputFocus={handleInputFocus}
                    />
                </ScrollView>
            ) : (
                <View style={[styles.container, 
                    isActive ? { paddingTop: insets.top, paddingBottom: insets.bottom } : { paddingBottom: insets.bottom }]}>
                    <KeyboardAvoidingView 
                        style={{ flex: 1 } }
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                    >
                        {!isEditMode && (
                            <WorkoutDetailsView 
                                workout={workout} 
                                elapsedTime={elapsedTime} 
                                isActive={isActive} 
                            />
                        )}
                        
                        {isActive && !isEditMode && (
                            <RestTimerBar lastSetTimestamp={lastSetTimestamp} category={lastExerciseCategory} />
                        )}

                        <WorkoutExerciseDetailsView
                            workout={workout}
                            exercises={exercises}
                            setExercises={setExercises}
                            isActive={isActive}
                            isEditMode={isEditMode}
                            isViewOnly={isViewOnly}
                            onRemoveExercise={onRemoveExercise}
                            onAddSet={handleAddSet}
                            onDeleteSet={onDeleteSet}
                            onUpdateSet={onUpdateSet}
                            onShowStatistics={onShowStatistics}
                            onInputFocus={handleInputFocus}
                        />
                    </KeyboardAvoidingView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.m,
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: 0,
    },
    text: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '700',
    },
    workoutHeader: {
        paddingBottom: theme.spacing.m,
        borderBottomColor: theme.colors.ui.border,
    },
    workoutHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    workoutTitleContainer: {
        width: '75%',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: theme.spacing.s,
        paddingBottom: theme.spacing.m,
    },
    workoutTitle: {
        color: theme.colors.text.primary,
        fontSize: 34,
        fontWeight: '700',
    },
    workoutDate: {
        color: theme.colors.text.secondary,
        fontSize: 17,
        fontWeight: '400',
        textTransform: 'none',
    },
    workoutDuration: {
        color: theme.colors.status.warning,
        fontSize: 18,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
    workoutStatsContainer: {
        gap: theme.spacing.m,
    },
    horizontalStatsRow: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    horizontalStatItem: {
        flex: 1,
    },
    horizontalStatLabel: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '300',
        marginBottom: theme.spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    horizontalStatValue: {
        color: theme.colors.text.primary,
        fontSize: 17,
        fontWeight: '400',
    },
    compactStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    compactStatLabel: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '300',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        minWidth: 64,
    },
    statItem: {
        marginBottom: theme.spacing.m,
    },
    statLabel: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '300',
        marginBottom: theme.spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: theme.colors.text.primary,
        fontSize: 24,
        fontWeight: '700',
    },
    muscleTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
        flex: 1,
    },
    muscleTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: theme.spacing.s,
        paddingVertical: theme.spacing.s,
        borderRadius: 8,
    },
    muscleTagText: {
        color: theme.colors.text.tertiary,
        fontSize: 13,
        fontWeight: '300',
    },
    secondaryMuscleTag: {
        backgroundColor: theme.colors.ui.glass,
        opacity: 0.8,
    },
    secondaryMuscleTagText: {
        color: theme.colors.text.secondary,
        fontSize: 12,
        fontWeight: '300',
    },
    intensityBadge: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    intensityLow: {
        backgroundColor: 'rgba(52, 199, 89, 0.15)',
    },
    intensityMedium: {
        backgroundColor: 'rgba(255, 159, 10, 0.15)',
    },
    intensityHigh: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
    },
    intensityText: {
        color: theme.colors.text.primary,
        fontSize: 13,
        fontWeight: '300',
    },
    notesText: {
        color: theme.colors.text.primary,
        fontSize: 17,
        lineHeight: 24,
        marginTop: theme.spacing.s,
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '300',
        marginBottom: theme.spacing.m,
    },
    placeholderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 40,
        paddingTop: 96,
        paddingBottom: 96, 
        alignSelf: 'center',
    },
    placeholderText: {
        color: theme.colors.text.primary,
        fontSize: 17,
        textAlign: 'center',
        marginTop: theme.spacing.m,
        fontWeight: '400',
        opacity: 0.5,
        maxWidth: 200,
        lineHeight: 24,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: 22,
        backgroundColor: theme.colors.ui.glass,
    },
    exerciseCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 22,
        marginBottom: theme.spacing.m,
        padding: theme.spacing.m,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: { flex: 1 },
    exerciseNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    exerciseName: {
        color: theme.colors.text.primary,
        fontSize: 17,
        fontWeight: '400',
        flex: 1,
    },
    exerciseMenuButton: {
        padding: 8,
        marginLeft: 8,
    },
    menuModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuModalContent: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: 22,
        padding: theme.spacing.m,
        minWidth: 200,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.m,
        gap: theme.spacing.m,
    },
    menuItemDelete: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
        marginTop: theme.spacing.s,
    },
    menuItemText: {
        color: theme.colors.text.primary,
        fontSize: 17,
        fontWeight: '400',
    },
    menuItemTextDelete: {
        color: theme.colors.status.error,
    },
    exerciseInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseMusclesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
        flex: 1,
    },
    exerciseTag: {
        backgroundColor: theme.colors.ui.glassStrong,
        paddingHorizontal: theme.spacing.s,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryMuscleTag: {
    },
    exerciseTagText: {
        color: theme.colors.text.tertiary,
        fontSize: 12,
        fontWeight: '500',
    },
    lockedTag: {
        opacity: 0.85, 
        backgroundColor: theme.colors.ui.glassStrong, 
    },
    lockedTagText: {
        color: theme.colors.text.tertiary, 
        opacity: 1, 
    },
    addSetButton: {
        marginTop: theme.spacing.s,
        backgroundColor: 'transparent', 
        borderWidth: 1,
        borderColor: theme.colors.status.active, 
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addSetButtonText: {
        color: theme.colors.status.active, 
        fontSize: 15,
        fontWeight: '600',
    },
    deleteAction: {
        backgroundColor: theme.colors.status.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginLeft: theme.spacing.s,
    },
    lockAction: {
        backgroundColor: theme.colors.status.active,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginRight: theme.spacing.s,
    },
    setsContainer: {
        marginTop: theme.spacing.s,
        paddingTop: theme.spacing.s,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
    setsHeader: {
        flex: 1,
        flexDirection: 'row',
        marginBottom: theme.spacing.s,
        paddingLeft: 4,
    },
    setHeaderText: {
        flex: 1,
        color: theme.colors.text.secondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        paddingBottom: theme.spacing.s,
        paddingTop: 4,
        paddingHorizontal: 0,
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
    },
    setText: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 16,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        lineHeight: 20, 
        ...Platform.select({
            android: { includeFontPadding: false }, 
        }),
    },
    setInput: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center', 
        color: theme.colors.text.primary,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: 'transparent', 
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border, 
        paddingVertical: 8, 
        paddingBottom: 4, 
        marginHorizontal: 4,
        minHeight: 44,
        lineHeight: 20, 
        ...Platform.select({
            android: { includeFontPadding: false }, 
        }),
    },
    deleteSetAction: {
        backgroundColor: theme.colors.status.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    restTimerContainer: {
        paddingBottom: theme.spacing.m,
        paddingTop: 12,
    },
    restTimerBarBg: {
        height: 6,
        backgroundColor: theme.colors.ui.border,
        borderRadius: 3,
        marginBottom: theme.spacing.s,
        overflow: 'hidden',
    },
    restTimerBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    restTimerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restTimerLabel: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    restTimerValue: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    WorkoutFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: 10,
        borderRadius: 50,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fabButton: {
        backgroundColor: theme.colors.status.active,
        padding: 10,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeWorkoutButton: {
        backgroundColor: theme.colors.status.active, 
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    completeWorkoutButtonText: {
        color: theme.colors.text.primary,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    modalTitle: {
        color: theme.colors.text.primary,
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: theme.spacing.s,
    },
    infoSectionText: {
        color: theme.colors.text.secondary,
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: theme.spacing.s,
    },
    infoBadge: {
        backgroundColor: theme.colors.ui.glass,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    infoBadgeLabel: {
        color: theme.colors.text.secondary,
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    infoBadgeValue: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});
