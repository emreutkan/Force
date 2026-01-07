import { updateExerciseOrder } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveWorkoutExerciseCard } from './ActiveWorkoutExerciseCard';
import { EditWorkoutExerciseCard } from './EditWorkoutExerciseCard';
import { ViewOnlyExerciseCard } from './ViewOnlyExerciseCard';

interface WorkoutExerciseDetailsViewProps {
    workout: any;
    exercises: any[];
    setExercises: (exercises: any[]) => void;
    isActive: boolean;
    isEditMode?: boolean;
    isViewOnly?: boolean;
    onAddExercise?: () => void;
    onRemoveExercise?: (exerciseId: number) => void;
    onAddSet?: (exerciseId: number, data: any) => void;
    onDeleteSet?: (setId: number) => void;
    onUpdateSet?: (setId: number, updatedSet: any) => void;
    onShowStatistics?: (exerciseId: number) => void;
    onInputFocus?: (index: number) => void;
}

export default function WorkoutExerciseDetailsView({
    workout,
    exercises,
    setExercises,
    isActive,
    isEditMode = false,
    isViewOnly = false,
    onRemoveExercise,
    onAddSet,
    onDeleteSet,
    onUpdateSet,
    onShowStatistics,
    onInputFocus
}: WorkoutExerciseDetailsViewProps) {
    const insets = useSafeAreaInsets();
    const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<any>(null);
    const flatListRef = useRef<any>(null);
    const focusedIndexRef = useRef<number | null>(null);

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
            if (ref) {
                swipeableRefs.current.set(key, ref);
            } else {
                swipeableRefs.current.delete(key);
            }
        },
        onOpen: (key: string) => {
            if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== key) {
                const ref = swipeableRefs.current.get(currentlyOpenSwipeable.current);
                ref?.close();
            }
            currentlyOpenSwipeable.current = key;
        },
        onClose: (key: string) => {
            if (currentlyOpenSwipeable.current === key) {
                currentlyOpenSwipeable.current = null;
            }
        },
        closeAll: () => {
            swipeableRefs.current.forEach(ref => ref.close());
            currentlyOpenSwipeable.current = null;
        }
    };

    const handleAddSet = (exerciseId: number, data: any) => {
        onAddSet?.(exerciseId, data);
    };

    const handleUpdateSet = async (setId: number, updatedSet: any) => {
        // updatedSet is the API response from ExerciseCard, which contains the full updated set data
        // Don't update local state optimistically - let the parent refresh handle it
        // This ensures we always have the latest data from the backend
        if (onUpdateSet) {
            onUpdateSet(setId, updatedSet);
        }
    };

    // Handle input focus - scroll to the exercise when keyboard appears
    const handleInputFocus = useCallback((index: number) => {
        focusedIndexRef.current = index;
        onInputFocus?.(index);
        
        // Scroll to the focused exercise after a short delay to ensure keyboard is shown
        setTimeout(() => {
            if (flatListRef.current && index !== null && index >= 0 && index < exercises.length) {
                flatListRef.current.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.3, // Position the item 30% from top to account for keyboard
                });
            }
        }, Platform.OS === 'ios' ? 300 : 100);
    }, [exercises.length, onInputFocus]);

    // Scroll to focused item when keyboard appears
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                if (focusedIndexRef.current !== null && flatListRef.current) {
                    const index = focusedIndexRef.current;
                    if (index >= 0 && index < exercises.length) {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({
                                index,
                                animated: true,
                                viewPosition: 0.3,
                            });
                        }, 100);
                    }
                }
            }
        );

        return () => {
            keyboardWillShowListener.remove();
        };
    }, [exercises.length]);

    // Check if there's at least one exercise with at least one set
    const hasSets = exercises.some((ex: any) => ex.sets && ex.sets.length > 0);

    const renderItems = ({item, drag, isActive: isDragging, getIndex}: {item: any, drag: () => void, isActive: boolean, getIndex: () => number | undefined}) => {
        let exerciseCard;
        
        if (isActive) {
            // Use ActiveWorkoutExerciseCard for active workouts
            exerciseCard = (
                <ActiveWorkoutExerciseCard
                    key={item.order}
                    workoutExercise={item}
                    onRemove={onRemoveExercise}
                    onAddSet={handleAddSet}
                    onDeleteSet={onDeleteSet}
                    onUpdateSet={handleUpdateSet}
                    swipeControl={swipeControl}
                    onInputFocus={() => {
                        handleInputFocus(getIndex() ?? 0);
                    }}
                    onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                    onShowStatistics={onShowStatistics}
                />
            );
        } else {
            // Use EditWorkoutExerciseCard for editing workouts
            exerciseCard = (
                <EditWorkoutExerciseCard
                    key={item.order}
                    workoutExercise={item}
                    onRemove={onRemoveExercise}
                    onAddSet={handleAddSet}
                    onDeleteSet={onDeleteSet}
                    onUpdateSet={handleUpdateSet}
                    swipeControl={swipeControl}
                    onInputFocus={() => {
                        handleInputFocus(getIndex() ?? 0);
                    }}
                    onShowInfo={(exercise: any) => setSelectedExerciseInfo(exercise)}
                    onShowStatistics={onShowStatistics}
                />
            );
        }

        // Only use ScaleDecorator when inside DraggableFlatList
        if (isViewOnly && !isActive) {
            return exerciseCard;
        }

        return (
            <ScaleDecorator activeScale={0.95}>
                {exerciseCard}
            </ScaleDecorator>
        );
    };

    return (
        <>
            <View style={styles.content}>
                {exercises && exercises.length > 0 ? (
                    <>
                        {isViewOnly && !isActive && (
                            <Text style={styles.sectionTitle}>RAW OUTPUT</Text>
                        )}
                        {isViewOnly && !isActive ? (
                            <View>
                                {exercises.map((item: any, index: number) => {
                                    const exercise = item.exercise || (item.name ? item : null);
                                    if (!exercise) return null;
                                    return (
                                        <ViewOnlyExerciseCard
                                            key={item.id || index}
                                            exercise={exercise}
                                            sets={item.sets || []}
                                        />
                                    );
                                })}
                            </View>
                        ) : (
                            <DraggableFlatList
                                ref={flatListRef}
                                data={exercises}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: hasSets && isActive ? 200 : 120 }}
                                onDragEnd={async ({ data }: { data: any }) => {
                                    setExercises(data);
                                    const exerciseOrders = data.map((item: any, index: number) => ({ id: item.id, order: index + 1 }));
                                    const response = await updateExerciseOrder(workout.id, exerciseOrders);
                                    if (response) {
                                        console.log('Exercise order updated successfully');
                                    } else {
                                        console.log('Failed to update exercise order');
                                    }
                                }}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderItems}
                                simultaneousHandlers={[]}
                                activationDistance={Platform.OS === 'android' ? 20 : 10}
                                dragItemOverflow={false}
                                onScrollToIndexFailed={(info) => {
                                    // Handle scroll to index failure gracefully
                                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                                    wait.then(() => {
                                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                                    });
                                }}
                            />
                        )}
                    </>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>No exercises yet. Tap the + button to add exercises.</Text>
                    </View>
                )}
            </View>

            <Modal
                visible={selectedExerciseInfo !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedExerciseInfo(null)}
            >
                {selectedExerciseInfo && (
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
                            <Text style={styles.modalTitle}>{selectedExerciseInfo.name}</Text>
                            <TouchableOpacity 
                                onPress={() => setSelectedExerciseInfo(null)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
                            {selectedExerciseInfo.description && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Description</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.description}</Text>
                                </View>
                            )}
                            
                            {selectedExerciseInfo.instructions && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Instructions</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.instructions}</Text>
                                </View>
                            )}
                            
                            {selectedExerciseInfo.safety_tips && (
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoSectionTitle}>Safety Tips</Text>
                                    <Text style={styles.infoSectionText}>{selectedExerciseInfo.safety_tips}</Text>
                                </View>
                            )}
                            
                            <View style={styles.infoRow}>
                                {selectedExerciseInfo.category && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeLabel}>Category</Text>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.category}</Text>
                                    </View>
                                )}
                                
                                {selectedExerciseInfo.difficulty_level && (
                                    <View style={styles.infoBadge}>
                                        <Text style={styles.infoBadgeLabel}>Difficulty</Text>
                                        <Text style={styles.infoBadgeValue}>{selectedExerciseInfo.difficulty_level}</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: theme.spacing.s,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: theme.spacing.m,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    placeholderText: {
        color: '#8E8E93',
        fontSize: 17,
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1E',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalContent: {
        flex: 1,
    },
    modalContentContainer: {
        padding: 16,
    },
    infoSection: {
        marginBottom: 24,
    },
    infoSectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    infoSectionText: {
        fontSize: 17,
        color: '#8E8E93',
        lineHeight: 24,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
    infoBadge: {
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    infoBadgeLabel: {
        fontSize: 13,
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '300',
    },
    infoBadgeValue: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '400',
    },
});

