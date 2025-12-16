import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Shared Types & Helpers ---

interface SwipeActionProps {
    progress: any;
    dragX: any;
    onPress: () => void;
    iconSize?: number;
    style?: any;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
}

const SwipeAction = ({ progress, dragX, onPress, iconSize = 24, style, iconName, color = "#FFFFFF" }: SwipeActionProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
            <Animated.View style={animatedStyle}>
                <Ionicons name={iconName} size={iconSize} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// --- Sub-Components ---

const SetRow = ({ set, index, onDelete, isLocked, swipeRef, onOpen, onClose }: any) => {
    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onDelete(set.id)}
            iconSize={20}
            style={styles.deleteSetAction}
            iconName="trash-outline"
        />
    );

    return (
        <ReanimatedSwipeable
            ref={swipeRef}
            onSwipeableWillOpen={onOpen}
            onSwipeableWillClose={onClose}
            renderRightActions={isLocked ? undefined : renderRightActions}
            containerStyle={{ marginBottom: 0 }}
            enabled={!isLocked}
        >
            <View style={styles.setRow}>
                <Text style={[styles.setText, { width: 0, color: '#8E8E93' }]}>{index + 1}</Text>
                <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.weight}</Text>
                <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.reps}</Text>
                <Text style={[styles.setText, { width: 40, textAlign: 'right' }]}>{set.reps_in_reserve ?? '-'}</Text>
            </View>
        </ReanimatedSwipeable>
    );
};

const AddSetRow = ({ lastSet, onAdd, isLocked, onFocus }: any) => {
    const [inputs, setInputs] = useState({ weight: '', reps: '', rir: '', restTime: '', isWarmup: false });

    // Auto-fill from last set on mount or when lastSet changes, but only if inputs are empty
    useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || lastSet.weight?.toString() || '',
                reps: prev.reps || lastSet.reps?.toString() || ''
            }));
        }
    }, [lastSet]);

    const handleAdd = () => {
        if (!inputs.weight || !inputs.reps) return;

        let restTimeSeconds = 0;
        if (inputs.restTime) {
            if (inputs.restTime.includes(':')) {
                const [min, sec] = inputs.restTime.split(':').map(Number);
                restTimeSeconds = (min || 0) * 60 + (sec || 0);
            } else {
                restTimeSeconds = parseInt(inputs.restTime) || 0;
            }
        } else if (lastSet?.rest_time_before_set) {
            restTimeSeconds = lastSet.rest_time_before_set;
        }

        onAdd({
            weight: parseFloat(inputs.weight),
            reps: parseFloat(inputs.reps),
            reps_in_reserve: inputs.rir ? parseFloat(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds
        });

        // Reset fields but keep weight/reps for next set convenience? 
        // User asked to clear inputs in previous code.
        setInputs({ weight: inputs.weight, reps: inputs.reps, rir: '', restTime: '', isWarmup: false }); 
    };

    if (isLocked) return null;

    return (
        <View style={styles.setRow}>
            <TouchableOpacity
                onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                style={{ width: 30, alignItems: 'center' }}
            >
                <Text style={[styles.setText, { color: inputs.isWarmup ? '#FF9F0A' : '#8E8E93', fontWeight: inputs.isWarmup ? 'bold' : 'normal' }]}>
                    {inputs.isWarmup ? 'W' : '+'}
                </Text>
            </TouchableOpacity>

            <TextInput
                style={[styles.setInput, { width: '10%', textAlign: 'center' }]}
                value={inputs.weight}
                onChangeText={t => setInputs(p => ({ ...p, weight: t }))}
                keyboardType="numeric"
                placeholder={lastSet?.weight?.toString() || "kg"}
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput, { width: '10%', textAlign: 'center' }]}
                value={inputs.reps}
                onChangeText={t => setInputs(p => ({ ...p, reps: t }))}
                keyboardType="numeric"
                placeholder={lastSet?.reps?.toString() || "reps"}
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput, { width: '10%', textAlign: 'right' }]}
                value={inputs.rir}
                onChangeText={t => setInputs(p => ({ ...p, rir: t }))}
                keyboardType="numeric"
                placeholder="RIR"
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            <TextInput
                style={[styles.setInput, { width: '10%', textAlign: 'right', fontSize: 14 }]}
                value={inputs.restTime}
                onChangeText={t => setInputs(p => ({ ...p, restTime: t }))}
                keyboardType="numbers-and-punctuation"
                placeholder="Rest"
                placeholderTextColor="#555"
                onFocus={onFocus}
            />
            
            <TouchableOpacity
                style={[styles.addSetButton, (!inputs.weight || !inputs.reps) && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={!inputs.weight || !inputs.reps}
            >
                <Ionicons name="add" size={20} color="#2C2C2E" />
            </TouchableOpacity>
        </View>
    );
};

const ExerciseCard = ({ workoutExercise, isLocked, onToggleLock, onRemove, onAddSet, onDeleteSet, swipeControl }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

    const renderLeftActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onToggleLock(idToLock)}
            iconSize={24}
            style={[styles.lockAction, { backgroundColor: isLocked ? '#FF9F0A' : '#0A84FF' }]}
            iconName={isLocked ? "lock-open-outline" : "lock-closed"}
        />
    );

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onRemove(idToLock)}
            iconSize={24}
            style={styles.deleteAction}
            iconName="trash-outline"
        />
    );

    return (
        <ReanimatedSwipeable
            ref={((ref: any) => swipeControl.register(exerciseKey, ref)) as any}
            onSwipeableWillOpen={() => swipeControl.onOpen(exerciseKey)}
            onSwipeableWillClose={() => swipeControl.onClose(exerciseKey)}
            renderLeftActions={renderLeftActions}
            renderRightActions={!isLocked ? renderRightActions : undefined}
            containerStyle={{ marginBottom: 12 }}
        >
            <View style={[styles.exerciseCard, { marginBottom: 0 }]}>
                <View style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>
                            {exercise.name} {isLocked && <Ionicons name="lock-closed" size={14} color="#8E8E93" />}
                        </Text>
                        <Text style={styles.exerciseDetails}>
                            {exercise.primary_muscle} {exercise.equipment_type ? `• ${exercise.equipment_type}` : ''}
                        </Text>
                    </View>
                </View>

                {(sets.length > 0 || !isLocked) && (
                    <View style={styles.setsContainer}>
                        <View style={styles.setsHeader}>
                            <Text style={[styles.setHeaderText, {  }]}>Set</Text>
                            <Text style={[styles.setHeaderText, { width: '20%', textAlign: 'center' }]}>kg</Text>
                            <Text style={[styles.setHeaderText, { width: '20%', textAlign: 'center' }]}>Reps</Text>
                            <Text style={[styles.setHeaderText, { width: '20%', textAlign: 'right' }]}>RPE</Text>
                        </View>
                        
                        {sets.map((set: any, index: number) => {
                            const setKey = `set-${set.id || index}`;
                            return (
                                <SetRow
                                    key={set.id || index}
                                    set={set}
                                    index={index}
                                    onDelete={onDeleteSet}
                                    isLocked={isLocked}
                                    swipeRef={(ref: any) => swipeControl.register(setKey, ref)}
                                    onOpen={() => swipeControl.onOpen(setKey)}
                                    onClose={() => swipeControl.onClose(setKey)}
                                />
                            );
                        })}

                        <AddSetRow 
                            lastSet={lastSet}
                            onAdd={(data: any) => onAddSet(idToLock, data)}
                            isLocked={isLocked}
                            onFocus={swipeControl.closeAll}
                        />
                    </View>
                )}
            </View>
        </ReanimatedSwipeable>
    );
};

// --- Main Component ---

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    
    // Swipe Logic
    const swipeableRefs = useRef<Map<string, SwipeableMethods>>(new Map());
    const currentlyOpenSwipeable = useRef<string | null>(null);

    const closeCurrentSwipeable = useCallback(() => {
        if (currentlyOpenSwipeable.current) {
            const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
            ref?.close();
            currentlyOpenSwipeable.current = null;
        }
    }, []);

    const swipeControl = {
        register: (key: string, ref: SwipeableMethods | null) => {
            if (ref) swipeableRefs.current.set(key, ref);
            else swipeableRefs.current.delete(key);
        },
        onOpen: (key: string) => {
            if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== key) {
                swipeableRefs.current.get(currentlyOpenSwipeable.current)?.close();
            }
            currentlyOpenSwipeable.current = key;
        },
        onClose: (key: string) => {
            if (currentlyOpenSwipeable.current === key) currentlyOpenSwipeable.current = null;
        },
        closeAll: closeCurrentSwipeable
    };

    const toggleLock = (id: number) => {
        closeCurrentSwipeable();
        setLockedExerciseIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={closeCurrentSwipeable}>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.workoutHeader}>
                    <View>
                        <Text style={styles.workoutTitle}>{workout.title}</Text>
                        <Text style={styles.workoutDate}>
                            {new Date(workout.created_at).toLocaleDateString(undefined, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </Text>
                    </View>
                    <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                        {elapsedTime}
                    </Text>
                </View>

                <ScrollView style={styles.content} onScrollBeginDrag={closeCurrentSwipeable}>
                    {workout.notes ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>NOTES</Text>
                            <Text style={styles.notesText}>{workout.notes}</Text>
                        </View>
                    ) : null}

                    {workout.exercises && workout.exercises.length > 0 ? (
                        <View style={styles.section}>
                            {workout.exercises.map((workoutExercise: any, index: number) => (
                                <ExerciseCard
                                    key={workoutExercise.id || index}
                                    workoutExercise={workoutExercise}
                                    isLocked={lockedExerciseIds.has(workoutExercise.id || index)}
                                    onToggleLock={toggleLock}
                                    onRemove={onRemoveExercise}
                                    onAddSet={onAddSet}
                                    onDeleteSet={onDeleteSet}
                                    swipeControl={swipeControl}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>No exercises recorded</Text>
                        </View>
                    )}
                </ScrollView>
                
                {isActive && onAddExercise && (
                    <View style={styles.fabContainer}>
                        <TouchableOpacity 
                            onPress={() => {
                                closeCurrentSwipeable();
                                onAddExercise();
                            }}
                            style={styles.fabButton} 
                        >
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    workoutHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    workoutTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    workoutDate: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    workoutDuration: {
        fontSize: 18,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
    },
    placeholderContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#2C2C2E',
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        ...Platform.select({
            web: { boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)' },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
            }
        }),
    },
    fabButton: {
        backgroundColor: '#0A84FF',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseInfo: { flex: 1 },
    exerciseName: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    exerciseDetails: {
        color: '#8E8E93',
        fontSize: 14,
    },
    addSetButton: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginLeft: 8,
    },
    lockAction: {
        backgroundColor: '#0A84FF',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 12,
        marginRight: 8,
    },
    setsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    setHeaderText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
    },
    setRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
    setText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    setInput: {
        color: '#FFFFFF',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
        backgroundColor: '#2C2C2E',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginHorizontal: 4,
    },
    deleteSetAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
});
