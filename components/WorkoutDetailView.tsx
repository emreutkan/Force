import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutDetailViewProps {
    workout: any;
    elapsedTime: string;
    isActive: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: { weight: number, reps: number, reps_in_reserve?: number }) => void;
    onDeleteSet?: (setId: number) => void;
}

export default function WorkoutDetailView({ workout, elapsedTime, isActive, onAddExercise, onRemoveExercise, onAddSet, onDeleteSet }: WorkoutDetailViewProps) {
    const insets = useSafeAreaInsets();
    
    // 1. Add state for locked exercises
    const [lockedExerciseIds, setLockedExerciseIds] = useState<Set<number>>(new Set());
    const [newSetInputs, setNewSetInputs] = useState<Record<number, { weight: string, reps: string, rir: string }>>({});

    const handleInputChange = (exerciseId: number, field: 'weight' | 'reps' | 'rir', value: string) => {
        setNewSetInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || { weight: '', reps: '', rir: '' }),
                [field]: value
            }
        }));
    };

    const handleAddSetPress = (exerciseId: number) => {
        const inputs = newSetInputs[exerciseId];
        if (!inputs || !inputs.weight || !inputs.reps) return; // Basic validation
        
        onAddSet && onAddSet(exerciseId, {
            weight: parseFloat(inputs.weight),
            reps: parseFloat(inputs.reps),
            reps_in_reserve: inputs.rir ? parseFloat(inputs.rir) : 0
        });
        
        // Clear inputs after add
        setNewSetInputs(prev => {
            const next = { ...prev };
            delete next[exerciseId];
            return next;
        });
    };
    // 2. Add toggle function
    const toggleLock = (id: number) => {
        const newLocked = new Set(lockedExerciseIds);
        if (newLocked.has(id)) {
            newLocked.delete(id);
        } else {
            newLocked.add(id);
        }
        setLockedExerciseIds(newLocked);
    };
    const renderExerciseRightActions = (progress: any, dragX: any, exerciseId: number) => {
        if (!isActive || !onRemoveExercise) return null;
        
        return (
            <TouchableOpacity 
                style={styles.deleteAction}
                onPress={() => onRemoveExercise(exerciseId)}
            >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        );
    };

    const renderSetRightActions = (progress: any, dragX: any, setId: number) => {
        if (!isActive || !onDeleteSet) return null;
        
        return (
            <TouchableOpacity 
                style={styles.deleteSetAction}
                onPress={() => onDeleteSet(setId)}
            >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        );
    };

    if (!workout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.workoutHeader}>
                <View>
                    <Text style={styles.workoutTitle}>{workout.title}</Text>
                    <Text style={styles.workoutDate}>
                        {new Date(workout.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>
                <Text style={[styles.workoutDuration, { color: isActive ? 'orange' : '#8E8E93' }]}>
                    {elapsedTime}
                </Text>
            </View>

            <ScrollView style={styles.content}>
                {workout.notes ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>NOTES</Text>
                        <Text style={styles.notesText}>{workout.notes}</Text>
                    </View>
                ) : null}

                {workout.exercises && workout.exercises.length > 0 ? (
                    <View style={styles.section}>
                        {workout.exercises.map((workoutExercise: any, index: number) => {
                            // Handle both wrapped (from WorkoutExercise) and direct exercise objects if necessary
                            // Assuming backend returns a list of WorkoutExercise objects which contain an 'exercise' field
                            // OR if the serializer flattens it, checking for name directly.
                            
                            // Safe access: try workoutExercise.exercise first, fallback to workoutExercise itself if name exists there
                            const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
                            
                            if (!exercise) return null;

                            // 3. Check if this specific exercise is locked
                            // Use workoutExercise.id (the join table ID) if available to be unique per instance
                            const idToLock = workoutExercise.id || index;
                            const isLocked = lockedExerciseIds.has(idToLock);

                            return (
                                <ReanimatedSwipeable
                                    key={idToLock}
                                    renderRightActions={(progress, dragX) => renderExerciseRightActions(progress, dragX, idToLock)}
                                    containerStyle={{ marginBottom: 12 }}
                                    enabled={!isLocked} // Optional: Disable swipe delete if locked?
                                >
                                    <View style={[styles.exerciseCard, { marginBottom: 0 }]}>
                                        <View style={styles.exerciseRow}>
                                            <View style={styles.exerciseInfo}>
                                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                                <Text style={styles.exerciseDetails}>
                                                    {exercise.primary_muscle} {exercise.equipment_type ? `• ${exercise.equipment_type}` : ''}
                                                </Text>
                                            </View>
                                            
                                            {/* 4. Lock Toggle Button */}
                                            <TouchableOpacity 
                                                onPress={() => toggleLock(idToLock)}
                                                style={{ padding: 8 }}
                                            >
                                                <Ionicons 
                                                    name={isLocked ? "lock-closed" : "lock-open-outline"} 
                                                    size={22} 
                                                    color={isLocked ? "#FF3B30" : "#8E8E93"} 
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Sets List */}
                                        {workoutExercise.sets && workoutExercise.sets.length > 0 && (
                                            <View style={styles.setsContainer}>
                                                <View style={styles.setsHeader}>
                                                    <Text style={[styles.setHeaderText, { width: 30 }]}>Set</Text>
                                                    <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>kg</Text>
                                                    <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>Reps</Text>
                                                    <Text style={[styles.setHeaderText, { width: 40, textAlign: 'right' }]}>RPE</Text>
                                                </View>
                                                {workoutExercise.sets.map((set: any, setIndex: number) => (
                                                    <ReanimatedSwipeable
                                                        key={set.id || setIndex}
                                                        renderRightActions={(progress, dragX) => renderSetRightActions(progress, dragX, set.id)}
                                                        containerStyle={{ marginBottom: 0 }}
                                                        enabled={!isLocked}
                                                    >
                                                        <View style={styles.setRow}>
                                                            <Text style={[styles.setText, { width: 30, color: '#8E8E93' }]}>{setIndex + 1}</Text>
                                                            <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.weight}</Text>
                                                            <Text style={[styles.setText, { flex: 1, textAlign: 'center' }]}>{set.reps}</Text>
                                                            <Text style={[styles.setText, { width: 40, textAlign: 'right' }]}>{set.reps_in_reserve ?? '-'}</Text>
                                                        </View>
                                                    </ReanimatedSwipeable>
                                                ))}
                                                
                                                {/* New Set Input Row */}
                                                {!isLocked && (
                                                    <View style={styles.setRow}>
                                                        <Text style={[styles.setText, { width: 30, color: '#8E8E93' }]}>+</Text>
                                                        <TextInput
                                                            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
                                                            value={newSetInputs[idToLock]?.weight || ''}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'weight', val)}
                                                            keyboardType="numeric"
                                                            placeholder="kg"
                                                            placeholderTextColor="#2C2C2E"
                                                        />
                                                        <TextInput
                                                            style={[styles.setInput, { flex: 1, textAlign: 'center' }]}
                                                            value={newSetInputs[idToLock]?.reps || ''}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'reps', val)}
                                                            keyboardType="numeric"
                                                            placeholder="reps"
                                                            placeholderTextColor="#2C2C2E"
                                                        />
                                                        <TextInput
                                                            style={[styles.setInput, { width: 40, textAlign: 'right' }]}
                                                            value={newSetInputs[idToLock]?.rir || ''}
                                                            onChangeText={(val) => handleInputChange(idToLock, 'rir', val)}
                                                            keyboardType="numeric"
                                                            placeholder="RIR"
                                                            placeholderTextColor="#2C2C2E"
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* 5. Conditionally show Add Set button */}
                                        {!isLocked && (
                                            <TouchableOpacity 
                                                style={[
                                                    styles.addSetButtonContainer,
                                                    (!newSetInputs[idToLock]?.weight || !newSetInputs[idToLock]?.reps) && { opacity: 0.5 }
                                                ]}
                                                onPress={() => handleAddSetPress(idToLock)}
                                                disabled={!newSetInputs[idToLock]?.weight || !newSetInputs[idToLock]?.reps}
                                            >
                                                <Ionicons name="add" size={20} color="#2C2C2E" />
                                            </TouchableOpacity>
                                        )}
                                        
                        
                                    </View>
                                </ReanimatedSwipeable>
                            );
                        })}
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
                        onPress={onAddExercise}
                        style={styles.fabButton} 
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
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
            web: {
                boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
            },
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
        backgroundColor: '#0A84FF', // iOS Blue or Custom Orange
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
    exerciseInfo: {
        flex: 1,
    },
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
    addSetButtonContainer   : {
        backgroundColor: 'gray',
        borderRadius: 12,
        padding: 8,
        margin: 0,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingVertical: 8, // Increased for touch target
        paddingHorizontal: 4,
        alignItems: 'center',
        backgroundColor: '#1C1C1E', // Ensure background for swipeable
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
        borderRadius: 0, // Should be flush
    },
});

