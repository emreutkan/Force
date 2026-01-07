import { createWorkout } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Rest Day Card Component
interface RestDayCardProps {
    title?: string;
}

function RestDayCard({ title = 'Rest Day' }: RestDayCardProps) {
    return (
        <View style={trainingIntensityStyles.card}>
            <View style={trainingIntensityStyles.upperSection}>
                <View style={trainingIntensityStyles.upperLeft}>
                    <View style={trainingIntensityStyles.intensityBars}>
                        {[0.2, 0.2, 0.2].map((opacity, index) => (
                            <View 
                                key={index} 
                                style={[trainingIntensityStyles.bar, { opacity, backgroundColor: theme.colors.status.rest }]} 
                            />
                        ))}
                    </View>
                    <View style={trainingIntensityStyles.intensityTextContainer}>
                        <Text style={trainingIntensityStyles.intensityLabel}>REST DAY</Text>
                        <Text style={[trainingIntensityStyles.intensityValue, { color: theme.colors.status.rest }]}>RECOVERY</Text>
                        <Text style={trainingIntensityStyles.intensitySubtitle}>Active rest for optimal performance</Text>
                    </View>
                </View>
                <View style={[trainingIntensityStyles.intensityIcon, { backgroundColor: 'rgba(192, 132, 252, 0.1)', borderColor: 'rgba(192, 132, 252, 0.3)' }]}>
                    <Ionicons name="cafe" size={24} color={theme.colors.status.rest} />
                </View>
            </View>
        </View>
    );
}

// Training Intensity Card Component
interface TrainingIntensityCardProps {
    intensityScore?: number; // 0-10, will be shown as percentage (0-100%)
    totalVolume?: number; // Total volume in kg
    caloriesBurned?: number; // Calories burned (replaces progress)
}

function TrainingIntensityCard({ 
    intensityScore = 0,
    totalVolume = 0,
    caloriesBurned = 0
}: TrainingIntensityCardProps) {
    // Convert score 0-10 to percentage 0-100%
    const intensityPercentage = Math.round(intensityScore * 10);
    
    // Calculate intensity bars based on score
    const getIntensityBars = () => {
        const score = intensityScore;
        if (score >= 8) return [1, 1, 1]; // All high
        if (score >= 6) return [0.7, 1, 1]; // Medium, high, high
        if (score >= 4) return [0.5, 0.7, 1]; // Low, medium, high
        return [0.3, 0.5, 0.7]; // All low-medium
    };

    const bars = getIntensityBars();
    return (
        <View style={trainingIntensityStyles.card}>
            {/* Upper Section - Training Intensity */}
            <View style={trainingIntensityStyles.upperSection}>
                <View style={trainingIntensityStyles.upperLeft}>
                    <View style={trainingIntensityStyles.intensityBars}>
                        {bars.map((opacity, index) => (
                            <View 
                                key={index} 
                                style={[trainingIntensityStyles.bar, { opacity }]} 
                            />
                        ))}
                    </View>
                    <View style={trainingIntensityStyles.intensityTextContainer}>
                        <Text style={trainingIntensityStyles.intensityLabel}>TRAINING INTENSITY</Text>
                        <Text style={trainingIntensityStyles.intensityValue}>{intensityPercentage}%</Text>
                        <Text style={trainingIntensityStyles.intensitySubtitle}>Readiness score for peak volume</Text>
                    </View>
                </View>
                <View style={trainingIntensityStyles.intensityIcon}>
                    <Ionicons name="pulse" size={24} color={theme.colors.status.active} />
                </View>
            </View>

            {/* Lower Section - Total Volume & Calories */}
            {(totalVolume > 0 || caloriesBurned > 0) && (
                <View style={trainingIntensityStyles.lowerSection}>
                    {/* Total Volume */}
                    {totalVolume > 0 && (
                        <View style={trainingIntensityStyles.metricItem}>
                            <View style={[trainingIntensityStyles.metricIcon, trainingIntensityStyles.volumeIcon]}>
                                <Ionicons name="layers" size={20} color={theme.colors.text.primary} />
                            </View>
                            <View style={trainingIntensityStyles.metricContent}>
                                <Text style={trainingIntensityStyles.metricLabel}>TOTAL VOLUME</Text>
                                <Text style={trainingIntensityStyles.metricValue}>{totalVolume.toFixed(0)} KG</Text>
                            </View>
                        </View>
                    )}

                    {/* Calories Burned (replaces Progress) */}
                    {caloriesBurned > 0 && (
                        <View style={trainingIntensityStyles.metricItem}>
                            <View style={[trainingIntensityStyles.metricIcon, trainingIntensityStyles.caloriesIcon]}>
                                <Ionicons name="flame" size={20} color={theme.colors.text.primary} />
                            </View>
                            <View style={trainingIntensityStyles.metricContent}>
                                <Text style={trainingIntensityStyles.metricLabel}>CALORIES</Text>
                                <Text style={trainingIntensityStyles.metricValue}>{caloriesBurned.toFixed(0)} KCAL</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

interface WorkoutModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'create' | 'log';
    onSuccess?: () => void;
}

export default function WorkoutModal({ visible, onClose, mode, onSuccess }: WorkoutModalProps) {
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (visible) {
            setWorkoutTitle(mode === 'create' ? 'New Workout' : '');
            setDate(new Date());
            setShowDatePicker(false);
        }
    }, [visible, mode]);

    const toggleDatePicker = () => {
        Keyboard.dismiss();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDatePicker(!showDatePicker);
    };

    const handleSubmit = async () => {
        if (!workoutTitle.trim()) return;

        try {
            const payload = mode === 'log'
                ? { title: workoutTitle, date: date.toISOString(), is_done: true }
                : { title: workoutTitle };

            const result = await createWorkout(payload);

            if (result && typeof result === 'object' && result.error === "ACTIVE_WORKOUT_EXISTS") {
                Alert.alert("Active Workout Exists", "Please finish your current active workout first.");
                return;
            }

            if (result?.id) {
                onClose();
                setWorkoutTitle('');
                if (onSuccess) onSuccess();
                
                // Slight delay to allow modal to close smoothly before navigation
                setTimeout(() => {
                    if (mode === 'log') {
                        router.push(`/(workouts)/${result.id}/edit`);
                    } else {
                        router.push('/(active-workout)');
                    }
                }, 100);
            }
        } catch (e) {
            Alert.alert("Error", mode === 'log' ? "Failed to log workout." : "Failed to start workout.");
        }
    };

    const title = mode === 'create' ? 'Start Workout' : 'Log Past Workout';
    const buttonText = mode === 'create' ? 'Start Session' : 'Save Log';

    return (
        <Modal 
            visible={visible} 
            transparent 
            animationType="slide" 
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                {/* Backdrop - Tap to close */}
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Bottom Sheet Container */}
                <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.sheetContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Input Area */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Workout Title"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={workoutTitle}
                                onChangeText={setWorkoutTitle}
                                autoFocus
                                clearButtonMode="while-editing"
                            />
                        </View>

                        {mode === 'log' && (
                            <View style={styles.dateSection}>
                                <TouchableOpacity 
                                    style={[styles.dateButton, showDatePicker && styles.dateButtonActive]} 
                                    onPress={toggleDatePicker}
                                >
                                    <View style={styles.dateRow}>
                                        <Text style={styles.dateText}>
                                            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeText}>
                                            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Ionicons 
                                            name="chevron-forward" 
                                            size={16} 
                                            color={theme.colors.text.tertiary} 
                                            style={{ transform: [{ rotate: showDatePicker ? '90deg' : '0deg' }] }}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Inline Date Picker (Accordion Style) */}
                                {showDatePicker && (
                                    <View style={styles.datePickerContainer}>
                                        <DateTimePicker
                                            value={date}
                                            mode="datetime"
                                            display="spinner"
                                            themeVariant="dark"
                                            maximumDate={new Date()}
                                            onChange={(e, d) => d && setDate(d)}
                                            style={styles.picker}
                                            textColor={theme.colors.text.primary}
                                        />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.primaryButton, !workoutTitle.trim() && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={!workoutTitle.trim()}
                        >
                            <Text style={styles.primaryButtonText}>{buttonText}</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.ui.glassStrong,
    },
    sheetContainer: {
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden',
        paddingBottom: theme.spacing.navHeight,
        bottom: -40,
        backgroundColor: Platform.OS === 'android' ? theme.colors.ui.glassStrong : undefined,
    },
    header: {
        paddingTop: 22,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.l,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        letterSpacing: theme.typography.tracking.tight,
    },
    closeIcon: {
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.ui.surfaceHighlight,
        borderRadius: theme.borderRadius.full,
    },
    formContainer: {
        paddingHorizontal: theme.spacing.m,
        gap: theme.spacing.s,
    },
    label: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        paddingHorizontal: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wide,
    },
    inputWrapper: {
        backgroundColor: theme.colors.ui.surfaceHighlight,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    input: {
        padding: theme.spacing.m,
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '500',
    },
    dateSection: {
        marginTop: theme.spacing.xs,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.ui.surfaceHighlight,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    dateButtonActive: {
        backgroundColor: theme.colors.ui.primaryLight,
        borderColor: theme.colors.ui.primaryBorder,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    dateText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    timeText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.m,
    },
    datePickerContainer: {
        marginTop: theme.spacing.s,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.m,
        overflow: 'hidden',
    },
    picker: {
        height: 180,
    },
    primaryButton: {
        backgroundColor: theme.colors.status.active,
        paddingVertical: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        marginTop: theme.spacing.s,
    },
    btnDisabled: {
        backgroundColor: theme.colors.text.zinc800,
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '300',
        letterSpacing: theme.typography.tracking.wide,
    },
});

// Training Intensity Card Styles
const trainingIntensityStyles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
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
        marginBottom: theme.spacing.l,
    },
    upperLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: theme.spacing.s,
    },
    intensityBars: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-end',
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
        marginBottom: theme.spacing.xs,
    },
    intensityValue: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '900',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    intensitySubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
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
    lowerSection: {
        flexDirection: 'row',
        gap: theme.spacing.m,
    },
    metricItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    metricIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    volumeIcon: {
        backgroundColor: theme.colors.ui.primaryLight,
    },
    caloriesIcon: {
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
    },
    metricContent: {
        flex: 1,
    },
    metricLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
    },
    metricValue: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '900',
        color: theme.colors.text.primary,
    },
});

// Export TrainingIntensityCard and RestDayCard
export { RestDayCard, TrainingIntensityCard };

