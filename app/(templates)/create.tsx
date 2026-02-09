
import { createTemplateWorkout } from '@/api/Workout';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring,  } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateTemplateScreen() {
    const [title, setTitle] = useState('');
    const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
    const [, setExercisesData] = useState<any[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const insets = useSafeAreaInsets();

    // Fetch exercise details when IDs change
    useEffect(() => {
        const fetchDetails = async () => {
            if (selectedExerciseIds.length === 0) {
                setExercisesData([]);
                return;
            }
            // In a real app, we might have these cached or fetch them
            // For now, we'll try to get them from the API if needed,
            // but the ExerciseSearchModal might already provide them if we refactor it.
            // Let's assume we just have IDs for now but make the UI look good.
        };
        fetchDetails();
    }, [selectedExerciseIds]);

    // Animation values
    const createButtonScale = useSharedValue(0);
    const exercisesButtonScale = useSharedValue(1);

    const toggleExercise = (exerciseId: number) => {
        setSelectedExerciseIds(prev => {
            if (prev.includes(exerciseId)) {
                return prev.filter(id => id !== exerciseId);
            } else {
                return [...prev, exerciseId];
            }
        });
    };

    const moveExercise = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === selectedExerciseIds.length - 1) return;

        const newOrder = [...selectedExerciseIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        setSelectedExerciseIds(newOrder);
    };

    const removeExercise = (index: number) => {
        setSelectedExerciseIds(prev => prev.filter((_, i) => i !== index));
    };

    // Animate create button when form is valid
    useEffect(() => {
        if (title.trim() && selectedExerciseIds.length > 0) {
            createButtonScale.value = withSpring(1, { damping: 12 });
        } else {
            createButtonScale.value = withSpring(0);
        }
    }, [title, selectedExerciseIds.length, createButtonScale]);

    const handleExercisesButtonPress = () => {
        exercisesButtonScale.value = withSpring(0.95, { damping: 10 }, () => {
            exercisesButtonScale.value = withSpring(1, { damping: 10 });
        });
        setIsModalVisible(true);
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a template name.");
            return;
        }
        if (selectedExerciseIds.length === 0) {
            Alert.alert("Error", "Please select at least one exercise.");
            return;
        }

        setIsCreating(true);
        try {
            const result = await createTemplateWorkout({
                title: title.trim(),
                exercises: selectedExerciseIds
            });
            if (result?.id) {
                Alert.alert("Success", "Template created successfully!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                Alert.alert("Error", "Failed to create template.");
            }
        } catch (error) {
            console.error("Failed to create template:", error);
            Alert.alert("Error", "Failed to create template.");
        } finally {
            setIsCreating(false);
        }
    };

    const createButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: createButtonScale.value }],
        opacity: createButtonScale.value,
    }));


    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>NEW TEMPLATE</Text>
                    <Text style={styles.headerSubtitle}>DESIGN YOUR DRILL</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.inputSection}>
                        <Text style={styles.sectionLabel}>TEMPLATE TITLE</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="document-text" size={20} color={theme.colors.status.active} style={styles.inputIcon} />
                            <TextInput
                                placeholder="e.g. UPPER BODY PUSH"
                                placeholderTextColor={theme.colors.text.zinc700}
                                value={title}
                                onChangeText={setTitle}
                                style={styles.titleInput}
                                selectionColor={theme.colors.status.active}
                            />
                        </View>
                    </View>

                    <View style={styles.exercisesHeader}>
                        <Text style={styles.sectionLabel}>EXERCISES ({selectedExerciseIds.length})</Text>
                        <TouchableOpacity
                            onPress={handleExercisesButtonPress}
                            style={styles.addInlineButton}
                        >
                            <Ionicons name="add" size={18} color={theme.colors.status.active} />
                            <Text style={styles.addInlineText}>ADD</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedExerciseIds.length > 0 ? (
                        <View style={styles.selectedList}>
                            {selectedExerciseIds.map((exerciseId, index) => (
                                <View key={`${exerciseId}-${index}`} style={styles.exerciseCard}>
                                    <View style={styles.exerciseIndex}>
                                        <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.exerciseInfo}>
                                        <Text style={styles.exerciseName}>EXERCISE ID: {exerciseId}</Text>
                                        <Text style={styles.exerciseTag}>STRENGTH TRAIN</Text>
                                    </View>
                                    <View style={styles.exerciseActions}>
                                        <TouchableOpacity
                                            onPress={() => moveExercise(index, 'up')}
                                            disabled={index === 0}
                                            style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                                        >
                                            <Ionicons name="chevron-up" size={20} color={theme.colors.text.secondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => moveExercise(index, 'down')}
                                            disabled={index === selectedExerciseIds.length - 1}
                                            style={[styles.orderButton, index === selectedExerciseIds.length - 1 && styles.orderButtonDisabled]}
                                        >
                                            <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => removeExercise(index)}
                                            style={styles.removeButton}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={theme.colors.status.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.emptyState}
                            onPress={handleExercisesButtonPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="barbell-outline" size={32} color={theme.colors.text.zinc700} />
                            </View>
                            <Text style={styles.emptyText}>NO EXERCISES ADDED</Text>
                            <Text style={styles.emptySubtext}>TAP TO START BUILDING YOUR STACK</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                <Animated.View style={[styles.footer, createButtonStyle, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[styles.createButton, isCreating && styles.createButtonLoading]}
                        onPress={handleCreate}
                        disabled={isCreating}
                        activeOpacity={0.9}
                    >
                        {isCreating ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.createButtonText}>CONFIRM TEMPLATE</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>

            <ExerciseSearchModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSelectExercise={() => {}}
                onToggleExercise={toggleExercise}
                title="Add Exercises"
                mode="multiple"
                selectedExerciseIds={selectedExerciseIds}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.l,
        paddingBottom: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ui.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.ui.glassStrong,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.l,
    },
    inputSection: {
        marginBottom: theme.spacing.xl,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 1.5,
        marginBottom: theme.spacing.s,
        paddingHorizontal: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        paddingHorizontal: theme.spacing.m,
        height: 56,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    inputIcon: {
        marginRight: theme.spacing.m,
    },
    titleInput: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    exercisesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    addInlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        gap: 4,
    },
    addInlineText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.status.active,
        fontStyle: 'italic',
    },
    selectedList: {
        gap: theme.spacing.s,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    exerciseIndex: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    exerciseIndexText: {
        fontSize: 12,
        fontWeight: '900',
        color: theme.colors.text.secondary,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        marginBottom: 2,
    },
    exerciseTag: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    exerciseActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    orderButton: {
        padding: 6,
    },
    orderButtonDisabled: {
        opacity: 0.2,
    },
    removeButton: {
        padding: 6,
        marginLeft: 4,
    },
    emptyState: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderStyle: 'dashed',
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.ui.glassStrong,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    emptyText: {
        fontSize: 12,
        fontWeight: '900',
        color: theme.colors.text.primary,
        letterSpacing: 1,
    },
    emptySubtext: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.m,
        backgroundColor: 'transparent',
    },
    createButton: {
        backgroundColor: theme.colors.status.active,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonLoading: {
        opacity: 0.7,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
});
