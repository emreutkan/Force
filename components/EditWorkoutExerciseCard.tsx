import { updateSet } from '@/api/Exercises';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

// Validation functions
const validateSetData = (data: any): { isValid: boolean, errors: string[] } => {
    const errors: string[] = [];

    if (data.reps !== undefined && data.reps !== null) {
        const reps = typeof data.reps === 'string' ? parseInt(data.reps) : data.reps;
        if (isNaN(reps) || reps < 0 || reps > 100) {
            errors.push('Reps must be between 0 and 100');
        }
    }

    if (data.reps_in_reserve !== undefined && data.reps_in_reserve !== null) {
        const rir = typeof data.reps_in_reserve === 'string' ? parseInt(data.reps_in_reserve) : data.reps_in_reserve;
        if (isNaN(rir) || rir < 0 || rir > 100) {
            errors.push('RIR must be between 0 and 100');
        }
    }

    if (data.rest_time_before_set !== undefined && data.rest_time_before_set !== null) {
        const restTime = typeof data.rest_time_before_set === 'string' ? parseInt(data.rest_time_before_set) : data.rest_time_before_set;
        if (isNaN(restTime) || restTime < 0 || restTime > 10800) {
            errors.push('Rest time cannot exceed 3 hours');
        }
    }

    if (data.total_tut !== undefined && data.total_tut !== null) {
        const tut = typeof data.total_tut === 'string' ? parseInt(data.total_tut) : data.total_tut;
        if (isNaN(tut) || tut < 0 || tut > 600) {
            errors.push('Time under tension cannot exceed 10 minutes');
        }
    }

    return { isValid: errors.length === 0, errors };
};

interface SwipeActionProps {
    progress: any;
    dragX: any;
    onPress: () => void;
    iconName: keyof typeof Ionicons.glyphMap;
    color?: string;
}

const SwipeAction = ({ progress, dragX, onPress, iconName, color = "#FFFFFF" }: SwipeActionProps) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={0.7} 
            style={styles.deleteSetAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View style={[animatedStyle, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name={iconName} size={20} color={color} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// SetRow Component
const SetRow = ({ set, index, onDelete, onUpdate, onInputFocus, onShowStatistics, exerciseId }: any) => {
    const [showInsights, setShowInsights] = useState(false);
    const hasBadInsights = set.insights?.bad && Object.keys(set.insights.bad).length > 0;
    
    const formatRestTimeForInput = (seconds: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getInitialValues = () => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : '',
        tut: set.total_tut?.toString() || ''
    });

    const [localValues, setLocalValues] = useState(getInitialValues());
    const originalValuesRef = React.useRef(getInitialValues());
    const currentValuesRef = React.useRef(getInitialValues());
    const isUpdatingRef = React.useRef(false);

    React.useEffect(() => {
        if (isUpdatingRef.current) return;

        if (previousSetIdRef.current !== set.id) {
            previousSetIdRef.current = set.id;
            const newValues = getInitialValues();
            setLocalValues(newValues);
            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
            return;
        }

        const newValues = getInitialValues();
        const currentStored = originalValuesRef.current;
        
        const backendChanged = 
            newValues.weight !== currentStored.weight ||
            newValues.reps !== currentStored.reps ||
            newValues.rir !== currentStored.rir ||
            newValues.restTime !== currentStored.restTime ||
            newValues.tut !== currentStored.tut;

        if (backendChanged) {
            const localMatchesOriginal = 
                localValues.weight === currentStored.weight &&
                localValues.reps === currentStored.reps &&
                localValues.rir === currentStored.rir &&
                localValues.restTime === currentStored.restTime &&
                localValues.tut === currentStored.tut;

            if (localMatchesOriginal) {
                setLocalValues(newValues);
            }
            
            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
        }
    }, [set.id, set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set, set.total_tut]);

    const previousSetIdRef = React.useRef(set.id);

    const parseRestTime = (input: string): number => {
        if (!input) return 0;
        if (input.includes(':')) {
            const [min, sec] = input.split(':').map(Number);
            return (min || 0) * 60 + (sec || 0);
        }
        return parseInt(input) || 0;
    };

    const formatRestTime = (seconds: number) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleBlur = (field: string) => {
        const currentValue = currentValuesRef.current[field as keyof typeof currentValuesRef.current];
        const original = originalValuesRef.current[field as keyof typeof originalValuesRef.current];
        
        if (currentValue === original) return;

        const updateData: any = {};
        
        if (field === 'weight') {
            const numValue = currentValue ? parseFloat(currentValue) : null;
            const originalNum = original ? parseFloat(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.weight = numValue;
            }
        } else if (field === 'reps') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.reps = numValue;
            }
        } else if (field === 'rir') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.reps_in_reserve = numValue;
            }
        } else if (field === 'restTime') {
            const seconds = parseRestTime(currentValue);
            const originalSeconds = parseRestTime(original);
            if (seconds !== originalSeconds) {
                updateData.rest_time_before_set = seconds;
            }
        } else if (field === 'tut') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.total_tut = numValue;
            }
        } else if (field === 'tut') {
            const numValue = currentValue ? parseInt(currentValue) : null;
            const originalNum = original ? parseInt(original) : null;
            if (numValue !== originalNum && numValue !== null && !isNaN(numValue)) {
                updateData.total_tut = numValue;
            }
        }

        if (Object.keys(updateData).length > 0) {
            if (onUpdate) {
                isUpdatingRef.current = true;
                originalValuesRef.current = { ...currentValuesRef.current };
                
                Promise.resolve(onUpdate(set.id, updateData)).then(() => {
                    setTimeout(() => {
                        isUpdatingRef.current = false;
                    }, 1000);
                }).catch((error) => {
                    console.error('Update failed:', error);
                    const revertedValues = getInitialValues();
                    originalValuesRef.current = revertedValues;
                    currentValuesRef.current = revertedValues;
                    setLocalValues(revertedValues);
                    isUpdatingRef.current = false;
                });
            }
        }
    };

    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '0';
        const w = Number(weight);
        if (isNaN(w)) return '0';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onDelete(set.id)}
            iconName="trash-outline"
        />
    );

    const renderLeftActions = (progress: any, dragX: any) => {
        if (set.insights && (set.insights.good || set.insights.bad)) {
            return (
                <TouchableOpacity 
                    onPress={() => setShowInsights(true)} 
                    style={styles.insightsSetAction}
                >
                    <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            );
        }
        if (onShowStatistics && exerciseId) {
            return (
                <TouchableOpacity 
                    onPress={() => onShowStatistics(exerciseId)} 
                    style={styles.analysisSetAction}
                >
                    <Ionicons name="stats-chart-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <ReanimatedSwipeable
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}
            containerStyle={{ marginBottom: 0 }}
            overshootLeft={false}
            overshootRight={false}
            friction={2}
            leftThreshold={40}
            rightThreshold={40}
        >
            <View style={[styles.setRow, hasBadInsights && styles.setRowWithBadInsights]}>
                <View style={styles.setNumberContainer}>
                    <Text style={styles.setNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.setData}>
                    <View style={styles.setInputContainer}>
                        <Text style={styles.setValueText}>
                            {formatRestTime(set.rest_time_before_set || 0)}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={localValues.weight}
                            onChangeText={(value) => {
                                let sanitized = value.replace(/[:,]/g, '.');
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                if (sanitized === '' || numericRegex.test(sanitized)) {
                                    setLocalValues(prev => ({ ...prev, weight: sanitized }));
                                    currentValuesRef.current.weight = sanitized;
                                }
                            }}
                            onFocus={onInputFocus}
                            onBlur={() => handleBlur('weight')}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={localValues.reps}
                            onChangeText={(value) => {
                                setLocalValues(prev => ({ ...prev, reps: value }));
                                currentValuesRef.current.reps = value;
                            }}
                            onFocus={onInputFocus}
                            onBlur={() => handleBlur('reps')}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={localValues.rir}
                            onChangeText={(value) => {
                                setLocalValues(prev => ({ ...prev, rir: value }));
                                currentValuesRef.current.rir = value;
                            }}
                            onFocus={onInputFocus}
                            onBlur={() => handleBlur('rir')}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={localValues.tut}
                            onChangeText={(value) => {
                                const num = parseInt(value) || 0;
                                if (num >= 0 && num <= 600) {
                                    setLocalValues(prev => ({ ...prev, tut: value }));
                                    currentValuesRef.current.tut = value;
                                } else if (value === '') {
                                    setLocalValues(prev => ({ ...prev, tut: '' }));
                                    currentValuesRef.current.tut = '';
                                }
                            }}
                            onFocus={onInputFocus}
                            onBlur={() => handleBlur('tut')}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                </View>
            </View>
            
            <Modal
                visible={showInsights}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInsights(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowInsights(false)}>
                    <View style={styles.insightsModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.insightsModalContent}>
                                <View style={styles.insightsModalHeader}>
                                    <Text style={styles.insightsModalTitle}>Set {set.set_number} Insights</Text>
                                    <TouchableOpacity onPress={() => setShowInsights(false)}>
                                        <Ionicons name="close" size={24} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.insightsModalBody}>
                                    {set.insights?.good && Object.keys(set.insights.good).length > 0 && (
                                        <View style={styles.insightsSection}>
                                            <View style={styles.insightsSectionHeader}>
                                                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                                <Text style={styles.insightsSectionTitle}>Good</Text>
                                            </View>
                                            {Object.entries(set.insights.good).map(([key, insight]: [string, any]) => (
                                                <View key={key} style={styles.insightItem}>
                                                    <Text style={styles.insightReason}>{insight.reason}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    
                                    {set.insights?.bad && Object.keys(set.insights.bad).length > 0 && (
                                        <View style={styles.insightsSection}>
                                            <View style={styles.insightsSectionHeader}>
                                                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                                                <Text style={styles.insightsSectionTitle}>Areas to Improve</Text>
                                            </View>
                                            {Object.entries(set.insights.bad).map(([key, insight]: [string, any]) => (
                                                <View key={key} style={styles.insightItem}>
                                                    <Text style={styles.insightReason}>{insight.reason}</Text>
                                                    {insight.current_reps && (
                                                        <Text style={styles.insightDetail}>
                                                            Current: {insight.current_reps} reps
                                                        </Text>
                                                    )}
                                                    {insight.optimal_range && (
                                                        <Text style={styles.insightDetail}>
                                                            Optimal: {insight.optimal_range}
                                                        </Text>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ReanimatedSwipeable>
    );
};

// AddSetRow Component for Edit Workout - no TUT tracking, direct add
const AddSetRow = ({ lastSet, nextSetNumber, onAdd, onFocus }: any) => {
    const [inputs, setInputs] = useState({ 
        weight: '', 
        reps: '', 
        rir: '', 
        restTime: '',
        tut: '',
        isWarmup: false 
    });

    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    React.useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps || (lastSet.reps != null ? lastSet.reps.toString() : ''),
                rir: prev.rir || (lastSet.reps_in_reserve != null ? lastSet.reps_in_reserve.toString() : ''),
                restTime: prev.restTime || (lastSet.rest_time_before_set ? formatRestTimeForInput(lastSet.rest_time_before_set) : ''),
                tut: prev.tut || (lastSet.total_tut != null ? lastSet.total_tut.toString() : '')
            }));
        }
    }, [lastSet]);

    const formatRestTimeForInput = (seconds: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const parseRestTime = (input: string): number => {
        if (!input) return 0;
        if (input.includes(':')) {
            const [min, sec] = input.split(':').map(Number);
            return (min || 0) * 60 + (sec || 0);
        }
        return parseInt(input) || 0;
    };

    const handleAdd = () => {
        const setData = {
            weight: parseFloat(inputs.weight) || 0,
            reps: inputs.reps ? parseInt(inputs.reps) : 0,
            reps_in_reserve: inputs.rir ? parseInt(inputs.rir) : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: parseRestTime(inputs.restTime),
            total_tut: inputs.tut ? parseInt(inputs.tut) : undefined
        };

        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }
        
        onAdd(setData);

        // Reset inputs but keep weight
        setInputs({ 
            weight: inputs.weight, 
            reps: '', 
            rir: '', 
            restTime: '',
            tut: '',
            isWarmup: false 
        });
    };

    return (
        <>
            <View style={styles.addSetRow}>
                <TouchableOpacity
                    onPress={() => setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    style={styles.setNumberContainer}
                >
                    <Text style={[styles.setNumberText, { color: inputs.isWarmup ? '#FF9F0A' : theme.colors.text.secondary }]}>
                        {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                    </Text>
                </TouchableOpacity>

                <View style={styles.setData}>
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={inputs.restTime}
                            onChangeText={(value) => setInputs(p => ({ ...p, restTime: value }))}
                            onFocus={onFocus}
                            keyboardType="numbers-and-punctuation"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={inputs.weight}
                            onChangeText={(t: string) => {
                                let sanitized = t.replace(/[:,]/g, '.');
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                
                                if (sanitized === '' || numericRegex.test(sanitized)) {
                                    setInputs(p => ({ ...p, weight: sanitized }));
                                } else {
                                    setInputs(p => ({ ...p, weight: '' }));
                                }
                            }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                            onFocus={onFocus}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={inputs.reps}
                            onChangeText={(value) => setInputs(p => ({ ...p, reps: value }))}
                            onFocus={onFocus}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={inputs.rir}
                            onChangeText={(value) => setInputs(p => ({ ...p, rir: value }))}
                            onFocus={onFocus}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={styles.setInput}
                            value={inputs.tut}
                            onChangeText={(value) => {
                                const num = parseInt(value) || 0;
                                if (num >= 0 && num <= 600) {
                                    setInputs(p => ({ ...p, tut: value }));
                                } else if (value === '') {
                                    setInputs(p => ({ ...p, tut: '' }));
                                }
                            }}
                            onFocus={onFocus}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                        />
                    </View>
                </View>
            </View>

            {inputs.weight && (
                <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={handleAdd}
                    disabled={!inputs.weight}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addSetButtonText}>Add Set</Text>
                </TouchableOpacity>
            )}
        </>
    );
};

// Main Component
export const EditWorkoutExerciseCard = ({ workoutExercise, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, onUpdateSet }: any) => {
    const exercise = workoutExercise.exercise || (workoutExercise.name ? workoutExercise : null);
    if (!exercise) return null;

    const idToLock = workoutExercise.id;
    const exerciseKey = `exercise-${idToLock}`;
    const sets = workoutExercise.sets || [];
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const nextSetNumber = sets.length + 1;
    const [showMenu, setShowMenu] = useState(false);

    const handleUpdateSet = async (setId: number, data: any) => {
        const validation = validateSetData(data);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }

        try {
            const result = await updateSet(setId, data);
            if (result && typeof result === 'object' && result.error) {
                Alert.alert('Update Failed', result.message || 'An error occurred while updating the set');
                return;
            }
            
            if (result && typeof result === 'object' && !result.error) {
                if (onUpdateSet) {
                    onUpdateSet(setId, result);
                }
            }
        } catch (error) {
            console.error('Failed to update set - exception:', error);
            Alert.alert('Update Error', 'Failed to update set. Please try again.');
        }
    };

    const renderRightActions = (progress: any, dragX: any) => (
        <SwipeAction
            progress={progress}
            dragX={dragX}
            onPress={() => onRemove(idToLock)}
            iconName="trash-outline"
        />
    );

    return (
        <ReanimatedSwipeable
            ref={((ref: any) => swipeControl.register(exerciseKey, ref)) as any}
            onSwipeableWillOpen={() => swipeControl.onOpen(exerciseKey)}
            onSwipeableWillClose={() => swipeControl.onClose(exerciseKey)}
            renderRightActions={onRemove ? renderRightActions : undefined}
            enabled={true}
            containerStyle={{ marginBottom: theme.spacing.m }}
            overshootLeft={false}
            overshootRight={false}
            friction={2}
            leftThreshold={40}
            rightThreshold={40}
        >
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.exerciseName}>
                        {(exercise?.name || '').toUpperCase()}
                    </Text>
                    {sets.length > 0 && (
                        <View style={styles.setsBadge}>
                            <Text style={styles.setsBadgeText}>{sets.length} SETS</Text>
                        </View>
                    )}
                </View>

                <View style={styles.setsHeader}>
                    <View style={styles.setNumberContainer}>
                        <Text style={styles.setHeaderText}>SET</Text>
                    </View>
                    <View style={styles.setData}>
                        <View style={styles.setInputContainer}>
                            <Text style={styles.setHeaderText}>REST</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.setInputContainer}>
                            <Text style={styles.setHeaderText}>KG</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.setInputContainer}>
                            <Text style={styles.setHeaderText}>REPS</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.setInputContainer}>
                            <Text style={styles.setHeaderText}>RIR</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.setInputContainer}>
                            <Text style={styles.setHeaderText}>TUT</Text>
                        </View>
                    </View>
                </View>

                {sets.map((set: any, index: number) => (
                    <SetRow
                        key={set.id || index}
                        set={set}
                        index={index}
                        onDelete={onDeleteSet}
                        onUpdate={handleUpdateSet}
                        onInputFocus={() => {
                            swipeControl.closeAll();
                            onInputFocus?.();
                        }}
                        onShowStatistics={onShowStatistics}
                        exerciseId={exercise.id}
                    />
                ))}

                <AddSetRow 
                    lastSet={lastSet}
                    nextSetNumber={nextSetNumber}
                    onAdd={(data: any) => onAddSet(idToLock, data)}
                    onFocus={() => {
                        swipeControl.closeAll();
                        onInputFocus?.();
                    }}
                />
            </View>
        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    exerciseName: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        color: theme.colors.text.primary,
        flex: 1,
    },
    setsBadge: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderWidth: 1,
        borderColor: theme.colors.status.rest,
        borderRadius: theme.borderRadius.m,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
    },
    setsBadgeText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
    },
    setNumberContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setNumberText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    setData: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    setInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    setInput: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
        padding: 0,
        minWidth: 40,
    },
    setValueText: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.ui.border,
    },
    setRowWithBadInsights: {
        borderWidth: 2,
        borderColor: '#FF453A',
        backgroundColor: 'rgba(255, 69, 58, 0.08)',
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.s,
    },
    addSetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        marginTop: theme.spacing.m,
        paddingTop: theme.spacing.m,
        paddingVertical: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
    setsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.m,
        marginBottom: theme.spacing.s,
        paddingHorizontal: 4,
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    setHeaderText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addSetButton: {
        marginTop: theme.spacing.m,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.ui.border,
        borderRadius: theme.borderRadius.m,
        paddingVertical: theme.spacing.s,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addSetButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
    deleteSetAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    insightsSetAction: {
        backgroundColor: '#FF9F0A',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    analysisSetAction: {
        backgroundColor: '#48484A',
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: '100%',
        borderRadius: 0,
    },
    insightsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightsModalContent: {
        backgroundColor: '#1A1A1C',
        borderRadius: 24,
        width: '90%',
        maxHeight: '80%',
        borderWidth: 1.5,
        borderColor: '#2A2A2E',
    },
    insightsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    insightsModalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    insightsModalBody: {
        padding: 20,
        maxHeight: 500,
    },
    insightsSection: {
        marginBottom: 24,
    },
    insightsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    insightsSectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    insightItem: {
        backgroundColor: '#252528',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#323236',
    },
    insightReason: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    insightDetail: {
        color: '#8E8E93',
        fontSize: 13,
        marginTop: 4,
    },
});

