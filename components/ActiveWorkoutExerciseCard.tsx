import { updateSet } from '@/api/Exercises';
import { getRestTimerState, stopRestTimer } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { useActiveWorkoutStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useRestTimer } from './RestTimerBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB_SMALL = Platform.OS === 'web' && SCREEN_WIDTH <= 750;

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
    
    const formatRestTimeForInput = (seconds: number): string => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getInitialValues = () => ({
        weight: set.weight?.toString() || '',
        reps: set.reps?.toString() || '',
        rir: set.reps_in_reserve?.toString() || '',
        restTime: set.rest_time_before_set ? formatRestTimeForInput(set.rest_time_before_set) : ''
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
            newValues.restTime !== currentStored.restTime;

        if (backendChanged) {
            const localMatchesOriginal = 
                localValues.weight === currentStored.weight &&
                localValues.reps === currentStored.reps &&
                localValues.rir === currentStored.rir &&
                localValues.restTime === currentStored.restTime;

            if (localMatchesOriginal) {
                setLocalValues(newValues);
            }
            
            originalValuesRef.current = newValues;
            currentValuesRef.current = newValues;
        }
    }, [set.id, set.weight, set.reps, set.reps_in_reserve, set.rest_time_before_set]);

    const previousSetIdRef = React.useRef(set.id);

    const parseRestTime = (input: string): number => {
        if (!input) return 0;
        if (input.includes(':')) {
            const [min, sec] = input.split(':').map(Number);
            return (min || 0) * 60 + (sec || 0);
        }
        // If just a number, treat as seconds
        return parseInt(input) || 0;
    };

    const handleRestTimeChange = (value: string) => {
        // Allow typing numbers and colon
        const sanitized = value.replace(/[^0-9:]/g, '');
        
        // If user types just numbers (no colon), keep as is for now
        // We'll convert on blur
        setLocalValues(prev => ({ ...prev, restTime: sanitized }));
        currentValuesRef.current.restTime = sanitized;
    };

    const handleRestTimeBlur = () => {
        const currentValue = currentValuesRef.current.restTime;
        if (!currentValue) {
            handleBlur('restTime');
            return;
        }

        // If it's just a number (no colon), convert to minutes:seconds format
        if (!currentValue.includes(':')) {
            const seconds = parseInt(currentValue) || 0;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
            setLocalValues(prev => ({ ...prev, restTime: formatted }));
            currentValuesRef.current.restTime = formatted;
        }
        
        handleBlur('restTime');
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

    const formatRestTime = (seconds: number) => {
        if (!seconds) return '-';
        if (seconds < 60) return `${seconds}s`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s > 0 ? s + 's' : ''}`;
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
                        <TextInput
                            style={styles.setInput}
                            value={localValues.restTime}
                            onChangeText={handleRestTimeChange}
                            onFocus={onInputFocus}
                            onBlur={handleRestTimeBlur}
                            keyboardType="numbers-and-punctuation"
                            placeholder="0:00"
                            placeholderTextColor="#8E8E93"
                        />
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
                                // Only allow digits
                                const sanitized = value.replace(/[^0-9]/g, '');
                                // Limit to 1-100 - prevent typing numbers outside range
                                if (sanitized === '') {
                                    setLocalValues(prev => ({ ...prev, reps: '' }));
                                    currentValuesRef.current.reps = '';
                                } else {
                                    const num = parseInt(sanitized);
                                    if (num >= 1 && num <= 100) {
                                        setLocalValues(prev => ({ ...prev, reps: sanitized }));
                                        currentValuesRef.current.reps = sanitized;
                                    }
                                }
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
                                // Only allow digits
                                const sanitized = value.replace(/[^0-9]/g, '');
                                // Limit to 25 - prevent typing numbers greater than 25
                                if (sanitized === '') {
                                    setLocalValues(prev => ({ ...prev, rir: '' }));
                                    currentValuesRef.current.rir = '';
                                } else {
                                    const num = parseInt(sanitized);
                                    if (num >= 0 && num <= 25) {
                                        setLocalValues(prev => ({ ...prev, rir: sanitized }));
                                        currentValuesRef.current.rir = sanitized;
                                    }
                                }
                            }}
                            onFocus={onInputFocus}
                            onBlur={() => handleBlur('rir')}
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




// AddSetRow Component for Active Workout
const AddSetRow = ({ lastSet, nextSetNumber, index, onAdd, onFocus, workoutExerciseId }: any) => {
    const [inputs, setInputs] = useState({ 
        weight: '', 
        reps: null as number | null, 
        rir: null as number | null, 
        restTime: '', 
        isWarmup: false 
    });
    
    // Get rest timer state
    const { lastSetTimestamp, lastExerciseCategory } = useActiveWorkoutStore();
    const { timerText } = useRestTimer(lastSetTimestamp, lastExerciseCategory);
    const [isTrackingTUT, setIsTrackingTUT] = useState(false);
    const [tutStartTime, setTutStartTime] = useState<number | null>(null);
    const [currentTUT, setCurrentTUT] = useState(0);
    const [hasStopped, setHasStopped] = useState(false);

    const formatWeightForInput = (weight: number) => {
        if (!weight && weight !== 0) return '';
        const w = Number(weight);
        if (isNaN(w)) return '';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

    const formatRestTimeForInput = (seconds: number): string => {
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
        // If just a number, treat as seconds
        return parseInt(input) || 0;
    };

    useEffect(() => {
        if (lastSet) {
            setInputs(prev => ({
                ...prev,
                weight: prev.weight || (lastSet.weight != null ? formatWeightForInput(lastSet.weight) : ''),
                reps: prev.reps !== null ? prev.reps : (lastSet.reps != null ? lastSet.reps : null),
                // restTime is always from global timer, not from last set
            }));
        }
    }, [lastSet]);

    // TUT Timer effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTrackingTUT && tutStartTime !== null) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - tutStartTime) / 1000);
                setCurrentTUT(elapsed);
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTrackingTUT, tutStartTime]);

    const formatTUT = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${secs}s`;
    };


    const handleStartSet = async () => {
        try {
            // Pause the global rest timer when starting a set
            await stopRestTimer();
            setIsTrackingTUT(true);
            setTutStartTime(Date.now());
            setCurrentTUT(0);
            setHasStopped(false);
        } catch (error) {
            console.error('Failed to stop rest timer:', error);
        }
    };

    const handleStopSet = async () => {
        if (!isTrackingTUT || tutStartTime === null) return;
        setIsTrackingTUT(false);
        const finalTUT = Math.floor((Date.now() - tutStartTime) / 1000);
        setTutStartTime(null);
        setCurrentTUT(finalTUT);
        setHasStopped(true);
    };

    const handleAdd = async () => {
        let restTimeSeconds = 0;
        if (nextSetNumber === 1 && index === 0) {
            restTimeSeconds = 0;
        } else if (inputs.restTime) {
            restTimeSeconds = parseRestTime(inputs.restTime);
        } else {
            const restTime: any = await getRestTimerState();
            restTimeSeconds = restTime.elapsed_seconds || 0;
        }
        
        const setData = {
            weight: parseFloat(inputs.weight) || 0,
            reps: inputs.reps !== null ? inputs.reps : 0,
            reps_in_reserve: inputs.rir !== null ? inputs.rir : 0,
            is_warmup: inputs.isWarmup,
            rest_time_before_set: restTimeSeconds,
            total_tut: currentTUT > 0 ? currentTUT : undefined
        };

        const validation = validateSetData(setData);
        if (!validation.isValid) {
            Alert.alert('Validation Error', validation.errors.join('\n'));
            return;
        }
        
        onAdd(setData);

        setInputs({ weight: inputs.weight, reps: null, rir: null, restTime: '', isWarmup: false });
        setCurrentTUT(0);
        setHasStopped(false);
    };

    const isInitial = !isTrackingTUT && !hasStopped;
    const isTracking = isTrackingTUT;
    const isStopped = hasStopped && !isTrackingTUT;

    return (
        <>
            <View style={styles.addSetRow}>
                <TouchableOpacity
                    onPress={() => !isTracking && setInputs(p => ({ ...p, isWarmup: !p.isWarmup }))}
                    disabled={isTracking}
                    style={styles.setNumberContainer}
                >
                    <Text style={[styles.setNumberText, { color: inputs.isWarmup ? '#FF9F0A' : theme.colors.text.secondary }]}>
                        {inputs.isWarmup ? 'W' : String(nextSetNumber)}
                    </Text>
                </TouchableOpacity>

                <View style={styles.setData}>
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={[styles.setInput, isTracking && { opacity: 0.6 }]}
                            value={inputs.restTime || timerText || ''}
                            onChangeText={(value) => {
                                if (isTracking) return;
                                // Allow typing numbers and colon
                                const sanitized = value.replace(/[^0-9:]/g, '');
                                setInputs(p => ({ ...p, restTime: sanitized }));
                            }}
                            onBlur={() => {
                                // If empty after blur, clear it so global timer shows
                                if (!inputs.restTime) {
                                    setInputs(p => ({ ...p, restTime: '' }));
                                }
                                // Convert plain numbers to minutes:seconds format
                                else if (inputs.restTime && !inputs.restTime.includes(':')) {
                                    const seconds = parseInt(inputs.restTime) || 0;
                                    const mins = Math.floor(seconds / 60);
                                    const secs = seconds % 60;
                                    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
                                    setInputs(p => ({ ...p, restTime: formatted }));
                                }
                            }}
                            onFocus={onFocus}
                            keyboardType="numbers-and-punctuation"
                            placeholder={timerText || "0:00"}
                            placeholderTextColor="#8E8E93"
                            editable={!isTracking}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={[styles.setInput, isTracking && { opacity: 0.6 }]}
                            value={inputs.weight}
                            onChangeText={(t: string) => {
                                if (isTracking) return;
                                let sanitized = t.replace(/[:,]/g, '.');
                                const numericRegex = /^[0-9]*\.?[0-9]*$/;
                                
                                if (sanitized === '' || numericRegex.test(sanitized)) {
                                    setInputs(p => ({ ...p, weight: sanitized }));
                                } else {
                                    setInputs(p => ({ ...p, weight: '' }));
                                }
                            }}
                            keyboardType="numeric"
                            placeholder={lastSet?.weight?.toString() || "kg"}
                            placeholderTextColor="#8E8E93"
                            onFocus={onFocus}
                            editable={!isTracking}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={[styles.setInput, (isTracking || !isStopped) && { opacity: 0.6 }]}
                            value={inputs.reps !== null ? inputs.reps.toString() : ''}
                            onChangeText={(value) => {
                                if (isTracking || !isStopped) return;
                                // Only allow digits
                                const sanitized = value.replace(/[^0-9]/g, '');
                                // Limit to 1-100 - prevent typing numbers outside range
                                if (sanitized === '') {
                                    setInputs(p => ({ ...p, reps: null }));
                                } else {
                                    const num = parseInt(sanitized);
                                    if (num >= 1 && num <= 100) {
                                        setInputs(p => ({ ...p, reps: num }));
                                    }
                                }
                            }}
                            onFocus={onFocus}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                            editable={isStopped}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.setInputContainer}>
                        <TextInput
                            style={[styles.setInput, (isTracking || !isStopped) && { opacity: 0.6 }]}
                            value={inputs.rir !== null ? inputs.rir.toString() : ''}
                            onChangeText={(value) => {
                                if (isTracking || !isStopped) return;
                                // Only allow digits
                                const sanitized = value.replace(/[^0-9]/g, '');
                                // Limit to 25 - prevent typing numbers greater than 25
                                if (sanitized === '') {
                                    setInputs(p => ({ ...p, rir: null }));
                                } else {
                                    const num = parseInt(sanitized);
                                    if (num >= 0 && num <= 25) {
                                        setInputs(p => ({ ...p, rir: num }));
                                    }
                                }
                            }}
                            onFocus={onFocus}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#8E8E93"
                            editable={isStopped}
                        />
                    </View>
                </View>
            </View>

            {(isTracking || isStopped) && (
                <View style={styles.tutTimerContainer}>
                    <Text style={styles.tutTimerLabel}>Time Under Tension:</Text>
                    <View style={styles.tutInputContainer}>
                        {isTracking ? (
                            <Text style={styles.tutDisplayText}>{formatTUT(currentTUT)}</Text>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.tutInput}
                                    value={currentTUT.toString()}
                                    onChangeText={(text) => {
                                        const num = parseInt(text) || 0;
                                        if (num >= 0 && num <= 600) {
                                            setCurrentTUT(num);
                                        }
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#8E8E93"
                                />
                                <Text style={styles.tutInputSuffix}>s</Text>
                            </>
                        )}
                    </View>
                </View>
            )}

            {inputs.weight && (
                <TouchableOpacity
                    style={[
                        styles.addSetButton,
                        isInitial && styles.startSetButton,
                        isTracking && styles.stopSetButton,
                        isStopped && styles.addSetButton
                    ]}
                    onPress={() => {
                        if (isTracking) {
                            handleStopSet();
                        } else if (isInitial) {
                            handleStartSet();
                        } else if (isStopped) {
                            handleAdd();
                        }
                    }}
                    disabled={!inputs.weight || (isStopped && inputs.reps === null)}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.addSetButtonText,
                        isTracking && styles.stopSetButtonText,
                        isInitial && styles.startSetButtonText
                    ]}>
                        {(() => {
                            if (isTracking) return 'Stop Performing Set';
                            if (isInitial) return 'Start Set';
                            if (isStopped) return 'Add Set';
                            return 'Add Set';
                        })()}
                    </Text>
                </TouchableOpacity>
            )}
        </>
    );
};

// Main Component
export const ActiveWorkoutExerciseCard = ({ workoutExercise, onRemove, onAddSet, onDeleteSet, swipeControl, onInputFocus, onShowInfo, onShowStatistics, onUpdateSet }: any) => {
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

    const formatWeight = (weight: number) => {
        if (!weight && weight !== 0) return '0';
        const w = Number(weight);
        if (isNaN(w)) return '0';
        if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
        return parseFloat(w.toFixed(2)).toString();
    };

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
                    index={sets.length}
                    onAdd={(data: any) => onAddSet(idToLock, data)}
                    onFocus={() => {
                        swipeControl.closeAll();
                        onInputFocus?.();
                    }}
                    workoutExerciseId={idToLock}
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
    setWeight: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.status.rest,
    },
    setReps: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    setUnit: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
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
    pickerInput: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
        minHeight: 40,
    },
    pickerText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.l,
        fontWeight: '800',
    },
    tutTimerContainer: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.m,
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.m,
        marginTop: theme.spacing.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    tutTimerLabel: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: theme.spacing.xs,
    },
    tutInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutInput: {
        color: theme.colors.status.active,
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700',
        textAlign: 'center',
        minWidth: 60,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    tutDisplayText: {
        color: theme.colors.status.active,
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '700',
        textAlign: 'center',
    },
    tutInputSuffix: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '400',
        marginLeft: 4,
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
    startSetButton: {
        borderColor: theme.colors.status.active,
    },
    stopSetButton: {
        borderColor: theme.colors.status.error,
    },
    addSetButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
    stopSetButtonText: {
        color: theme.colors.status.error,
        fontWeight: '700',
    },
    startSetButtonText: {
        color: theme.colors.status.active,
        fontWeight: '700',
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
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerModalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    pickerTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    pickerScrollView: {
        maxHeight: 300,
    },
    pickerOption: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    pickerOptionSelected: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
    },
    pickerOptionText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
    },
    pickerOptionTextSelected: {
        color: '#0A84FF',
        fontWeight: '500',
    },
    restTimePickerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    restTimePickerColumn: {
        flex: 1,
    },
    restTimePickerLabel: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 16,
    },
    restTimePickerSeparator: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 40,
    },
    restTimePickerSeparatorText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },
    pickerConfirmButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 22,
        paddingVertical: 16,
        alignItems: 'center',
    },
    pickerConfirmButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
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

