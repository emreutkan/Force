import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { updateHeight, updateWeight, getWeightHistory, getAccount, deleteWeightEntry } from '@/api/account';
import { BodyMeasurement, CalculateBodyFatResponse, CreateMeasurementRequest, WeightHistoryEntry, WeightHistoryResponse } from '@/api/types';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 180;

const SwipeAction = ({ progress, onPress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function MeasurementsScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser } = useUserStore();
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
    const [isHeightModalVisible, setIsHeightModalVisible] = useState(false);
    const [isBodyFatModalVisible, setIsBodyFatModalVisible] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSavingHeight, setIsSavingHeight] = useState(false);
    const [isSavingWeight, setIsSavingWeight] = useState(false);
    const [previewResult, setPreviewResult] = useState<CalculateBodyFatResponse | null>(null);
    const [tempHeight, setTempHeight] = useState('');
    const [tempWeight, setTempWeight] = useState('');
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    
    // Body fat form state
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [neck, setNeck] = useState('');
    const [hips, setHips] = useState('');
    const [notes, setNotes] = useState('');

    const userGender = (user?.gender as 'male' | 'female') || 'male';
    const userHeight = user?.height;
    const isFemale = userGender === 'female';

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [measurementsData, weightHistoryData, accountData] = await Promise.all([
                getMeasurements(),
                getWeightHistory(),
                getAccount()
            ]);
            
            if (Array.isArray(measurementsData)) {
                setMeasurements(measurementsData);
            }
            
            if (weightHistoryData?.results) {
                setWeightHistory(weightHistoryData.results);
            }
            
            if (accountData?.weight) {
                setCurrentWeight(accountData.weight);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogWeight = () => {
        setTempWeight(currentWeight?.toString() || '');
        setIsWeightModalVisible(true);
    };

    const handleSaveWeight = async () => {
        if (!tempWeight) {
            Alert.alert("Missing Field", "Please enter your weight.");
            return;
        }

        setIsSavingWeight(true);
        try {
            const result = await updateWeight(parseFloat(tempWeight));
            if (result?.weight || result?.message) {
                await fetchUser();
                setCurrentWeight(parseFloat(tempWeight));
                setIsWeightModalVisible(false);
                loadData();
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to save weight");
        } finally {
            setIsSavingWeight(false);
        }
    };

    const handleEditHeight = () => {
        setTempHeight(userHeight?.toString() || '');
        setIsHeightModalVisible(true);
    };

    const handleSaveHeight = async () => {
        if (!tempHeight) {
            Alert.alert("Missing Field", "Please enter your height.");
            return;
        }

        setIsSavingHeight(true);
        try {
            const result = await updateHeight(parseFloat(tempHeight));
            if (result?.height || result?.message) {
                await fetchUser();
                setIsHeightModalVisible(false);
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to save height");
        } finally {
            setIsSavingHeight(false);
        }
    };

    const handleOpenBodyFatModal = () => {
        if (!userHeight) {
            setIsHeightModalVisible(true);
            setTempHeight('');
        } else {
            resetForm();
            setIsBodyFatModalVisible(true);
        }
    };

    const handlePreview = async () => {
        if (!validateInputs() || !userHeight) return;

        setIsCalculating(true);
        try {
            const baseData = {
                height: userHeight,
                weight: parseFloat(weight),
                waist: parseFloat(waist),
                neck: parseFloat(neck),
            };

            let result: CalculateBodyFatResponse;
            if (isFemale) {
                if (!hips) {
                    Alert.alert("Missing Field", "Hips measurement is required for women.");
                    setIsCalculating(false);
                    return;
                }
                result = await calculateBodyFatWomen({
                    ...baseData,
                    hips: parseFloat(hips),
                });
            } else {
                result = await calculateBodyFatMen(baseData);
            }

            if (result?.body_fat_percentage !== undefined) {
                setPreviewResult(result);
            } else if (result?.error) {
                Alert.alert("Calculation Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", error?.error || "Failed to calculate body fat");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSaveBodyFat = async () => {
        if (!validateInputs() || !userHeight) return;
        if (isFemale && !hips) {
            Alert.alert("Missing Field", "Hips measurement is required for women.");
            return;
        }

        setIsLoading(true);
        try {
            const payload: CreateMeasurementRequest = {
                height: userHeight,
                weight: parseFloat(weight),
                waist: parseFloat(waist),
                neck: parseFloat(neck),
                notes: notes || undefined,
            };

            if (isFemale) {
                payload.hips = parseFloat(hips);
            }

            const result = await createMeasurement(payload);
            
            if (result?.id) {
                Alert.alert("Success", "Measurement saved successfully!");
                resetForm();
                setIsBodyFatModalVisible(false);
                loadData();
            } else if (result?.hips) {
                Alert.alert("Error", Array.isArray(result.hips) ? result.hips[0] : result.hips);
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to save measurement");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWeight = (entry: WeightHistoryEntry) => {
        const hasBodyfat = entry.bodyfat !== null;
        
        if (hasBodyfat) {
            Alert.alert(
                "Delete Entry",
                "This entry has both weight and body fat data. What would you like to delete?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete Weight Only",
                        style: "default",
                        onPress: () => deleteWeight(entry.id, false)
                    },
                    {
                        text: "Delete Weight + Body Fat",
                        style: "destructive",
                        onPress: () => deleteWeight(entry.id, true)
                    }
                ]
            );
        } else {
            Alert.alert(
                "Delete Weight Entry",
                "Are you sure you want to delete this weight entry?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteWeight(entry.id, false)
                    }
                ]
            );
        }
    };

    const deleteWeight = async (weightId: number, deleteBodyfat: boolean) => {
        setIsLoading(true);
        try {
            const result = await deleteWeightEntry(weightId, deleteBodyfat);
            if (result?.message) {
                Alert.alert("Success", result.message);
                loadData();
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to delete weight entry");
        } finally {
            setIsLoading(false);
        }
    };

    const validateInputs = () => {
        if (!weight || !waist || !neck) {
            Alert.alert("Missing Fields", "Please fill in all required measurements.");
            return false;
        }
        if (isFemale && !hips) {
            Alert.alert("Missing Field", "Hips measurement is required for women.");
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setWeight('');
        setWaist('');
        setNeck('');
        setHips('');
        setNotes('');
        setPreviewResult(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatShortDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Prepare chart data
    const weightChartData = weightHistory.slice(-10).reverse();
    const bodyFatChartData = measurements.filter(m => m.body_fat_percentage).slice(-10).reverse();

    const getWeightChartPoints = () => {
        if (weightChartData.length === 0) return '';
        const maxWeight = Math.max(...weightChartData.map(w => w.weight));
        const minWeight = Math.min(...weightChartData.map(w => w.weight));
        const range = maxWeight - minWeight || 1;
        const padding = 20;
        const xStep = weightChartData.length > 1 ? (CHART_WIDTH - 2 * padding) / (weightChartData.length - 1) : 0;
        
        return weightChartData.map((entry, index) => {
            const x = padding + (index * xStep);
            const y = CHART_HEIGHT - padding - ((entry.weight - minWeight) / range) * (CHART_HEIGHT - 2 * padding);
            return `${x},${y}`;
        }).join(' ');
    };

    const getBodyFatChartPoints = () => {
        if (bodyFatChartData.length === 0) return '';
        const maxBF = Math.max(...bodyFatChartData.map(m => parseFloat(String(m.body_fat_percentage || 0))));
        const minBF = Math.min(...bodyFatChartData.map(m => parseFloat(String(m.body_fat_percentage || 0))));
        const range = maxBF - minBF || 1;
        const padding = 20;
        const xStep = bodyFatChartData.length > 1 ? (CHART_WIDTH - 2 * padding) / (bodyFatChartData.length - 1) : 0;
        
        return bodyFatChartData.map((entry, index) => {
            const x = padding + (index * xStep);
            const bf = parseFloat(String(entry.body_fat_percentage || 0));
            const y = CHART_HEIGHT - padding - ((bf - minBF) / range) * (CHART_HEIGHT - 2 * padding);
            return `${x},${y}`;
        }).join(' ');
    };

    // Use weight history for table (sorted by date, most recent first)
    const sortedWeightHistory = [...weightHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader title="Measurements" />

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                {/* Weight and Height Section */}
                <View style={styles.topSection}>
                    <View style={styles.valueCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="scale-outline" size={20} color="#0A84FF" />
                            <Text style={styles.valueLabel}>Weight</Text>
                        </View>
                        <Text style={styles.valueText}>
                            {currentWeight ? `${currentWeight}` : '--'}
                            <Text style={styles.valueUnit}> kg</Text>
                        </Text>
                        <TouchableOpacity 
                            style={styles.logButton}
                            onPress={handleLogWeight}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.logButtonText}>Log</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[styles.valueCard, styles.heightCard]}
                        onPress={handleEditHeight}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardHeader}>
                            <Ionicons name="resize-outline" size={20} color="#32D74B" />
                            <Text style={styles.valueLabel}>Height</Text>
                        </View>
                        <Text style={styles.valueText}>
                            {userHeight ? `${userHeight}` : '--'}
                            <Text style={styles.valueUnit}> cm</Text>
                        </Text>
                        <View style={styles.editHint}>
                            <Ionicons name="pencil" size={12} color="#8E8E93" />
                            <Text style={styles.editHintText}>Tap to edit</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Body Fat Calculation Button */}
                <TouchableOpacity 
                    style={styles.bodyFatButton}
                    onPress={handleOpenBodyFatModal}
                    activeOpacity={0.8}
                >
                    <View style={styles.bodyFatButtonContent}>
                        <View style={styles.bodyFatIconContainer}>
                            <Ionicons name="calculator" size={22} color="#FFFFFF" />
                        </View>
                        <Text style={styles.bodyFatButtonText}>Calculate Body Fat</Text>
                    </View>
                </TouchableOpacity>

                {/* Charts Section */}
                <View style={styles.chartsSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="trending-up-outline" size={18} color="#8E8E93" />
                        <Text style={styles.sectionHeaderText}>Progress</Text>
                    </View>
                    
                    {/* Weight Chart */}
                    <View style={styles.chartContainer}>
                        <View style={styles.chartHeader}>
                            <View style={styles.chartTitleRow}>
                                <View style={[styles.chartColorIndicator, { backgroundColor: '#0A84FF' }]} />
                                <Text style={styles.chartTitle}>Weight</Text>
                            </View>
                            {weightChartData.length > 0 && (
                                <Text style={styles.chartSubtitle}>
                                    {weightChartData[weightChartData.length - 1].weight} kg
                                </Text>
                            )}
                        </View>
                        {weightChartData.length > 0 ? (
                            <View style={styles.chart}>
                                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                                    <Polyline
                                        points={getWeightChartPoints()}
                                        fill="none"
                                        stroke="#0A84FF"
                                        strokeWidth="2.5"
                                    />
                                    {weightChartData.map((entry, index) => {
                                        const points = getWeightChartPoints().split(' ');
                                        const point = points[index]?.split(',');
                                        if (point) {
                                            return (
                                                <Circle
                                                    key={`${entry.date}-${index}`}
                                                    cx={parseFloat(point[0])}
                                                    cy={parseFloat(point[1])}
                                                    r="5"
                                                    fill="#0A84FF"
                                                    stroke="#000000"
                                                    strokeWidth="1"
                                                />
                                            );
                                        }
                                        return null;
                                    })}
                                </Svg>
                                <View style={styles.chartLabels}>
                                    <Text style={styles.chartLabel}>
                                        {weightChartData[0] ? formatShortDate(weightChartData[0].date) : ''}
                                    </Text>
                                    <Text style={styles.chartLabel}>
                                        {weightChartData[weightChartData.length - 1] ? formatShortDate(weightChartData[weightChartData.length - 1].date) : ''}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyChart}>
                                <Ionicons name="analytics-outline" size={48} color="#2C2C2E" />
                                <Text style={styles.emptyChartText}>No weight data yet</Text>
                                <Text style={styles.emptyChartSubtext}>Log your weight to see progress</Text>
                            </View>
                        )}
                    </View>

                    {/* Body Fat Chart */}
                    <View style={styles.chartContainer}>
                        <View style={styles.chartHeader}>
                            <View style={styles.chartTitleRow}>
                                <View style={[styles.chartColorIndicator, { backgroundColor: '#32D74B' }]} />
                                <Text style={styles.chartTitle}>Body Fat</Text>
                            </View>
                            {bodyFatChartData.length > 0 && (
                                <Text style={styles.chartSubtitle}>
                                    {parseFloat(String(bodyFatChartData[bodyFatChartData.length - 1].body_fat_percentage)).toFixed(1)}%
                                </Text>
                            )}
                        </View>
                        {bodyFatChartData.length > 0 ? (
                            <View style={styles.chart}>
                                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                                    <Polyline
                                        points={getBodyFatChartPoints()}
                                        fill="none"
                                        stroke="#32D74B"
                                        strokeWidth="2.5"
                                    />
                                    {bodyFatChartData.map((entry, index) => {
                                        const points = getBodyFatChartPoints().split(' ');
                                        const point = points[index]?.split(',');
                                        if (point) {
                                            return (
                                                <Circle
                                                    key={`bf-${entry.id}-${index}`}
                                                    cx={parseFloat(point[0])}
                                                    cy={parseFloat(point[1])}
                                                    r="5"
                                                    fill="#32D74B"
                                                    stroke="#000000"
                                                    strokeWidth="1"
                                                />
                                            );
                                        }
                                        return null;
                                    })}
                                </Svg>
                                <View style={styles.chartLabels}>
                                    <Text style={styles.chartLabel}>
                                        {bodyFatChartData[0] ? formatShortDate(bodyFatChartData[0].created_at) : ''}
                                    </Text>
                                    <Text style={styles.chartLabel}>
                                        {bodyFatChartData[bodyFatChartData.length - 1] ? formatShortDate(bodyFatChartData[bodyFatChartData.length - 1].created_at) : ''}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.emptyChart}>
                                <Ionicons name="analytics-outline" size={48} color="#2C2C2E" />
                                <Text style={styles.emptyChartText}>No body fat data yet</Text>
                                <Text style={styles.emptyChartSubtext}>Calculate body fat to see progress</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* History Table */}
                <View style={styles.tableSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={18} color="#8E8E93" />
                        <Text style={styles.sectionHeaderText}>History</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Weight</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Body Fat</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
                    </View>
                    {sortedWeightHistory.length > 0 ? (
                        sortedWeightHistory.map((entry) => (
                            <ReanimatedSwipeable
                                key={entry.id}
                                renderRightActions={(progress) => (
                                    <SwipeAction 
                                        progress={progress} 
                                        onPress={() => handleDeleteWeight(entry)} 
                                    />
                                )}
                                overshootRight={false}
                                friction={2}
                                rightThreshold={40}
                                containerStyle={styles.swipeableContainer}
                            >
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>
                                        {entry.weight} kg
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>
                                        {entry.bodyfat !== null 
                                            ? `${parseFloat(String(entry.bodyfat)).toFixed(1)}%`
                                            : '-'
                                        }
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>
                                        {formatDate(entry.date)}
                                    </Text>
                                </View>
                            </ReanimatedSwipeable>
                        ))
                    ) : (
                        <View style={styles.emptyTable}>
                            <Ionicons name="document-text-outline" size={48} color="#2C2C2E" />
                            <Text style={styles.emptyTableText}>No weight history yet</Text>
                            <Text style={styles.emptyTableSubtext}>Start logging your weight to track progress</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Weight Modal */}
            <Modal
                visible={isWeightModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsWeightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Log Weight</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={tempWeight}
                            onChangeText={setTempWeight}
                            keyboardType="numeric"
                            placeholder="75.5"
                            placeholderTextColor="#8E8E93"
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsWeightModalVisible(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveWeight}
                                disabled={isSavingWeight}
                            >
                                {isSavingWeight ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Height Modal */}
            <Modal
                visible={isHeightModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsHeightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Height</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={tempHeight}
                            onChangeText={setTempHeight}
                            keyboardType="numeric"
                            placeholder="175"
                            placeholderTextColor="#8E8E93"
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsHeightModalVisible(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveHeight}
                                disabled={isSavingHeight}
                            >
                                {isSavingHeight ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Body Fat Modal */}
            <Modal
                visible={isBodyFatModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setIsBodyFatModalVisible(false);
                    resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bodyFatModalContent}>
                        <ScrollView style={styles.modalScrollContent}>
                            <Text style={styles.modalTitle}>Calculate Body Fat</Text>
                            
                            <View style={styles.inputRow}>
                                <Text style={styles.inputLabel}>Weight (kg) *</Text>
                                <TextInput
                                    style={styles.inputRowInput}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholder="75.5"
                                    placeholderTextColor="#8E8E93"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={styles.inputLabel}>Waist (cm) *</Text>
                                <TextInput
                                    style={styles.inputRowInput}
                                    value={waist}
                                    onChangeText={setWaist}
                                    keyboardType="numeric"
                                    placeholder="85"
                                    placeholderTextColor="#8E8E93"
                                />
                            </View>

                            <View style={styles.inputRow}>
                                <Text style={styles.inputLabel}>Neck (cm) *</Text>
                                <TextInput
                                    style={styles.inputRowInput}
                                    value={neck}
                                    onChangeText={setNeck}
                                    keyboardType="numeric"
                                    placeholder="38"
                                    placeholderTextColor="#8E8E93"
                                />
                            </View>

                            {isFemale && (
                                <View style={styles.inputRow}>
                                    <Text style={styles.inputLabel}>Hips (cm) *</Text>
                                    <TextInput
                                        style={styles.inputRowInput}
                                        value={hips}
                                        onChangeText={setHips}
                                        keyboardType="numeric"
                                        placeholder="95"
                                        placeholderTextColor="#8E8E93"
                                    />
                                </View>
                            )}

                            <View style={styles.inputRow}>
                                <Text style={styles.inputLabel}>Notes</Text>
                                <TextInput
                                    style={styles.inputRowInput}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Optional"
                                    placeholderTextColor="#8E8E93"
                                />
                            </View>

                            {previewResult && (
                                <View style={styles.previewCard}>
                                    <Text style={styles.previewTitle}>Body Fat Estimate</Text>
                                    <Text style={styles.previewValue}>
                                        {previewResult.body_fat_percentage.toFixed(2)}%
                                    </Text>
                                    <Text style={styles.previewMethod}>{previewResult.method}</Text>
                                </View>
                            )}

                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[styles.button, styles.previewButton]}
                                    onPress={handlePreview}
                                    disabled={isCalculating}
                                >
                                    {isCalculating ? (
                                        <ActivityIndicator size="small" color="#0A84FF" />
                                    ) : (
                                        <Text style={styles.previewButtonText}>Preview</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSaveBodyFat}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    scrollContent: {
        padding: 16,
        paddingTop: 60,
    },
    topSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    valueCard: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    heightCard: {
        // Same as valueCard but touchable
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    valueLabel: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    valueText: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    valueUnit: {
        fontSize: 18,
        color: '#8E8E93',
        fontWeight: '500',
    },
    logButton: {
        backgroundColor: '#0A84FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    logButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    editHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    editHintText: {
        fontSize: 11,
        color: '#8E8E93',
        fontWeight: '500',
    },
    bodyFatButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 16,
        marginBottom: 28,
        overflow: 'hidden',
    },
    bodyFatButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    bodyFatIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyFatButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chartsSection: {
        gap: 16,
        marginBottom: 24,
    },
    chartContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chartColorIndicator: {
        width: 4,
        height: 20,
        borderRadius: 2,
    },
    chartTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    chartSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    chart: {
        alignItems: 'center',
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: CHART_WIDTH,
        marginTop: 8,
    },
    chartLabel: {
        fontSize: 11,
        color: '#8E8E93',
    },
    emptyChart: {
        height: CHART_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyChartText: {
        color: '#8E8E93',
        fontSize: 15,
        fontWeight: '500',
        marginTop: 12,
    },
    emptyChartSubtext: {
        color: '#2C2C2E',
        fontSize: 13,
        marginTop: 4,
    },
    tableSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
        marginBottom: 8,
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    tableCell: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    emptyTable: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyTableText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 12,
    },
    emptyTableSubtext: {
        color: '#2C2C2E',
        fontSize: 13,
        marginTop: 4,
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 12,
        marginLeft: 8,
    },
    swipeableContainer: {
        marginBottom: 0,
        backgroundColor: 'transparent',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    bodyFatModalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        padding: 18,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#2C2C2E',
    },
    modalButtonSave: {
        backgroundColor: '#0A84FF',
    },
    modalButtonCancelText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalButtonSaveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalScrollContent: {
        maxHeight: 500,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        width: 120,
    },
    inputRowInput: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#3C3C43',
    },
    previewCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#0A84FF',
        alignItems: 'center',
    },
    previewTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 8,
    },
    previewValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#0A84FF',
        marginBottom: 4,
    },
    previewMethod: {
        fontSize: 12,
        color: '#8E8E93',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    previewButton: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    previewButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0A84FF',
    },
    saveButton: {
        backgroundColor: '#0A84FF',
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
