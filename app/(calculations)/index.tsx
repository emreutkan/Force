import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { getAccount, getWeightHistory } from '@/api/account';
import { BodyMeasurement, WeightHistoryEntry } from '@/api/types';
import { theme, typographyStyles } from '@/constants/theme';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 48 - (CHART_PADDING * 2); // Card width minus padding

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Mini Trend Graph Component
 * Small graph for cards showing trend
 */
const MiniTrendGraph = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length < 2) return null;
    
    const MINI_WIDTH = 60;
    const MINI_HEIGHT = 20;
    
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const effectiveMin = minVal - range * 0.1;
    const effectiveRange = (maxVal + range * 0.1) - effectiveMin;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (data.length - 1)) * MINI_WIDTH;
        const y = MINI_HEIGHT - ((value - effectiveMin) / effectiveRange) * MINI_HEIGHT;
        return { x, y };
    };

    let pathD = `M ${getCoordinates(0, data[0]).x} ${getCoordinates(0, data[0]).y}`;
    data.forEach((val, index) => {
        if (index === 0) return;
        const coords = getCoordinates(index, val);
        pathD += ` L ${coords.x} ${coords.y}`;
    });

    const fillPathD = `${pathD} L ${MINI_WIDTH} ${MINI_HEIGHT} L 0 ${MINI_HEIGHT} Z`;

    return (
        <Svg width={MINI_WIDTH} height={MINI_HEIGHT}>
            <Defs>
                <LinearGradient id={`miniGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                </LinearGradient>
            </Defs>
            <Path d={fillPathD} fill={`url(#miniGradient-${color})`} />
            <Path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
};

/**
 * Combined Neural Trend Chart Component
 * Shows both weight and body fat on same graph
 */
const NeuralTrendChart = ({ weightData, bodyFatData }: { weightData: number[]; bodyFatData: number[] }) => {
    if (weightData.length < 2 && bodyFatData.length < 2) {
        return (
            <View style={styles.emptyChart}>
                <Ionicons name="stats-chart" size={32} color={theme.colors.text.secondary} />
                <Text style={styles.emptyChartText}>Not enough data to graph</Text>
            </View>
        );
    }

    // Normalize both datasets to 0-100 scale for comparison
    const normalizeData = (data: number[]) => {
        if (data.length < 2) return [];
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        const range = maxVal - minVal || 1;
        return data.map(val => ((val - minVal) / range) * 100);
    };

    const normalizedWeight = normalizeData(weightData);
    const normalizedBodyFat = normalizeData(bodyFatData);
    const maxLength = Math.max(normalizedWeight.length, normalizedBodyFat.length);

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (maxLength - 1 || 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (value / 100) * CHART_HEIGHT;
        return { x, y };
    };

    // Weight line (blue)
    let weightPathD = '';
    if (normalizedWeight.length >= 2) {
        weightPathD = `M ${getCoordinates(0, normalizedWeight[0]).x} ${getCoordinates(0, normalizedWeight[0]).y}`;
        normalizedWeight.forEach((val, index) => {
            if (index === 0) return;
            const coords = getCoordinates(index, val);
            weightPathD += ` L ${coords.x} ${coords.y}`;
        });
    }

    // Body fat line (purple)
    let bodyFatPathD = '';
    if (normalizedBodyFat.length >= 2) {
        bodyFatPathD = `M ${getCoordinates(0, normalizedBodyFat[0]).x} ${getCoordinates(0, normalizedBodyFat[0]).y}`;
        normalizedBodyFat.forEach((val, index) => {
            if (index === 0) return;
            const coords = getCoordinates(index, val);
            bodyFatPathD += ` L ${coords.x} ${coords.y}`;
        });
    }

    return (
        <View style={{ height: CHART_HEIGHT }}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#5E8AFF" stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#5E8AFF" stopOpacity="0.0" />
                    </LinearGradient>
                    <LinearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#BF5AF2" stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#BF5AF2" stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>
                
                {/* Weight gradient fill */}
                {weightPathD && (
                    <Path 
                        d={`${weightPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} 
                        fill="url(#weightGradient)" 
                    />
                )}
                
                {/* Body fat gradient fill */}
                {bodyFatPathD && (
                    <Path 
                        d={`${bodyFatPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} 
                        fill="url(#bodyFatGradient)" 
                    />
                )}
                
                {/* Weight line */}
                {weightPathD && (
                    <Path d={weightPathD} stroke="#5E8AFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                
                {/* Body fat line */}
                {bodyFatPathD && (
                    <Path d={bodyFatPathD} stroke="#BF5AF2" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
            </Svg>
        </View>
    );
};

const SwipeAction = ({ progress, onPress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </Animated.View>
        </TouchableOpacity>
    );
};

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export default function MeasurementsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useUserStore();
    
    // State
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Modals & Forms
    const [modals, setModals] = useState({ weight: false, bodyFat: false });
    const [tempVal, setTempVal] = useState('');
    const [bfForm, setBfForm] = useState({ weight: '', waist: '', neck: '', hips: '', notes: '' });
    const [previewResult, setPreviewResult] = useState<any>(null);

    // Derived Data
    const userHeight = user?.height;
    const isFemale = user?.gender === 'female';

    // Get latest Body Fat
    const latestBodyFat = useMemo(() => {
        if (measurements.length === 0) return null;
        return measurements
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.body_fat_percentage;
    }, [measurements]);

    // Graph Data Preparation (Needs to be Chronological: Old -> New)
    const weightGraphData = useMemo(() => {
        return weightHistory
            .slice(0, 10) 
            .reverse()
            .map(item => item.weight);
    }, [weightHistory]);

    const bodyFatGraphData = useMemo(() => {
        return measurements
            .filter(m => m.body_fat_percentage)
            .slice(0, 10)
            .reverse()
            .map(m => parseFloat(m.body_fat_percentage as any));
    }, [measurements]);

    // Mini trend data for cards (last 5-7 points)
    const weightMiniData = useMemo(() => {
        return weightHistory.slice(0, 7).reverse().map(item => item.weight);
    }, [weightHistory]);

    const bodyFatMiniData = useMemo(() => {
        return measurements
            .filter(m => m.body_fat_percentage)
            .slice(0, 7)
            .reverse()
            .map(m => parseFloat(m.body_fat_percentage as any));
    }, [measurements]);

    // List Data (Newest First)
    const sortedHistory = [...weightHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const weightChange = useMemo(() => {
        if (sortedHistory.length < 2) return { value: 0, direction: null };
        const current = sortedHistory[0]?.weight;
        const previous = sortedHistory[1]?.weight;
        if (!current || !previous) return { value: 0, direction: null };
        const change = current - previous;
        return {
            value: Math.abs(change),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : null
        };
    }, [sortedHistory]);

    // Load Data
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [measData, weightData, accountData] = await Promise.all([
                getMeasurements(),
                getWeightHistory(),
                getAccount()
            ]);
            
            if (Array.isArray(measData)) setMeasurements(measData);
            if (weightData?.results) setWeightHistory(weightData.results);
            if (accountData?.weight) setCurrentWeight(accountData.weight);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ... (Keep existing handlers: handleSaveWeight, handleCalculateBodyFat, handleDeleteEntry) ...
    // Note: I am omitting the handler implementations to keep the focus on the UI changes, 
    // insert your existing logic functions here.
    const openWeightModal = () => { setTempVal(currentWeight?.toString() || ''); setModals(prev => ({ ...prev, weight: true })); };
    const handleSaveWeight = async () => { /* Insert existing logic */ };
    const handleCalculateBodyFat = async (previewOnly = false) => {
        if (!userHeight) {
            Alert.alert("Height Required", "Please set height in account");
            return;
        }

        const weight = parseFloat(bfForm.weight);
        const waist = parseFloat(bfForm.waist);
        const neck = parseFloat(bfForm.neck);
        const hips = isFemale ? parseFloat(bfForm.hips) : undefined;

        if (!weight || !waist || !neck || (isFemale && !hips)) {
            Alert.alert("Missing Fields", "Please fill in all required measurements");
            return;
        }

        setIsProcessing(true);
        try {
            let result;
            if (isFemale) {
                result = await calculateBodyFatWomen({
                    height: userHeight,
                    weight: weight,
                    waist: waist,
                    neck: neck,
                    hips: hips!
                });
            } else {
                result = await calculateBodyFatMen({
                    height: userHeight,
                    weight: weight,
                    waist: waist,
                    neck: neck
                });
            }

            if (result.body_fat_percentage) {
                setPreviewResult(result);
                if (!previewOnly) {
                    // Save the measurement
                    await createMeasurement({
                        height: userHeight,
                        weight: weight,
                        waist: waist,
                        neck: neck,
                        hips: isFemale ? hips : undefined,
                        notes: bfForm.notes || undefined
                    });
                    await loadData();
                    setModals(prev => ({ ...prev, bodyFat: false }));
                    setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                    setPreviewResult(null);
                }
            } else {
                Alert.alert("Error", result.message || "Failed to calculate body fat");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to calculate body fat");
        } finally {
            setIsProcessing(false);
        }
    };
    const handleDeleteEntry = (entry: WeightHistoryEntry) => { /* Insert existing logic */ };
    const openBodyFatModal = () => { if (!userHeight) { Alert.alert("Height Required", "Please set height in account"); return; } setModals(prev => ({ ...prev, bodyFat: true })); if (currentWeight) setBfForm(prev => ({ ...prev, weight: currentWeight.toString() })); };


    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.mainTitle}>MEASUREMENTS</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={openWeightModal}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardsRow}>
                    <TouchableOpacity 
                        style={styles.biometricCard} 
                        onPress={openWeightModal} 
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>WEIGHT</Text>
                            {weightChange.direction && (
                                <View style={{ marginLeft: 4 }}>
                                    <Ionicons 
                                        name={weightChange.direction == 'up' ? 'trending-up' : 'trending-down'} 
                                        size={14} 
                                        color="#34D399"
                                    />
                                </View>
                            )}
                        </View>
                        <View style={styles.cardValueRow}>
                            <Text style={styles.cardValue}>{currentWeight ? currentWeight.toFixed(1) : '--'}</Text>
                            <Text style={styles.cardUnit}>KG</Text>
                        </View>
                        {weightMiniData.length >= 2 && (
                            <View style={styles.miniGraphContainer}>
                                <MiniTrendGraph data={weightMiniData} color="#5E8AFF" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.biometricCard} 
                        onPress={openBodyFatModal} 
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardLabel}>BODY FAT</Text>
                            {latestBodyFat && (
                                <View style={{ marginLeft: 4 }}>
                                    <Ionicons 
                                        name="trending-down" 
                                        size={14} 
                                        color="#BF5AF2"
                                    />
                                </View>
                            )}
                        </View>
                        <View style={styles.cardValueRow}>
                            <Text style={styles.cardValue}>{latestBodyFat ? parseFloat(latestBodyFat.toString()).toFixed(1) : '--'}</Text>
                            <Text style={styles.cardUnit}>%</Text>
                        </View>
                        {bodyFatMiniData.length >= 2 && (
                            <View style={styles.miniGraphContainer}>
                                <MiniTrendGraph data={bodyFatMiniData} color="#BF5AF2" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.neuralTrendSection}>
                    <View style={styles.graphCard}>
                    <View style={styles.neuralTrendHeader}>
                        <View style={styles.neuralTrendTitleRow}>
                            <Ionicons name="pulse" size={18} color="#FFFFFF" />
                            <Text style={styles.neuralTrendTitle}>TREND</Text>
                        </View>
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#5E8AFF' }]} />
                                <Text style={styles.legendText}>WEIGHT</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#BF5AF2' }]} />
                                <Text style={styles.legendText}>BODY FAT</Text>
                            </View>
                        </View>
                    </View>
                        <NeuralTrendChart 
                            weightData={weightGraphData} 
                            bodyFatData={bodyFatGraphData}
                        />
                    </View>

    
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historySectionTitle}> HISTORY</Text>
                        <TouchableOpacity>
                            <Ionicons name="refresh" size={16} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    {sortedHistory.length > 0 ? (
                        <View style={styles.historyContainer}>
                            {sortedHistory.map((item) => (
                                <ReanimatedSwipeable
                                    key={item.id}
                                    renderRightActions={(p) => <SwipeAction progress={p} onPress={() => handleDeleteEntry(item)} />}
                                    friction={2}
                                >
                                    <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
                                        <View style={styles.historyContent}>
                                            <Text style={styles.historyDate}>
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </Text>
                                            <View style={styles.historyMetricsRow}>
                                                <View style={styles.historyMetric}>
                                                    <Text style={styles.historyValue}>{item.weight}</Text>
                                                    <Text style={styles.historyUnit}>KG</Text>
                                                </View>
                                                {item.bodyfat && (
                                                    <View style={styles.historyMetric}>
                                                        <Text style={styles.historyBfValue}>{parseFloat(item.bodyfat.toString()).toFixed(1)}</Text>
                                                        <Text style={styles.historyBfUnit}>%</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                                    </TouchableOpacity>
                                </ReanimatedSwipeable>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="list" size={48} color={theme.colors.text.secondary} />
                            <Text style={styles.emptyText}>No logs recorded yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={modals.weight} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Update Weight</Text>
                        <View style={styles.bigInputWrapper}>
                            <TextInput style={styles.bigInput} value={tempVal} onChangeText={setTempVal} keyboardType="numeric" autoFocus placeholderTextColor={theme.colors.text.secondary} />
                            <Text style={styles.bigInputSuffix}>kg</Text>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setModals(prev => ({ ...prev, weight: false }))}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={handleSaveWeight}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
             <Modal visible={modals.bodyFat} animationType="slide" presentationStyle="pageSheet">
                 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetContainer}>
                     <View style={styles.sheetContent}>
                         <View style={styles.sheetHeader}>
                             <Text style={styles.sheetTitle}>Calculate Body Fat</Text>
                             <TouchableOpacity onPress={() => {
                                 setModals(p => ({...p, bodyFat: false}));
                                 setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                                 setPreviewResult(null);
                             }}>
                                 <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                             </TouchableOpacity>
                         </View>

                         <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                             {previewResult ? (
                                 <View style={styles.previewContainer}>
                                     <Text style={styles.previewTitle}>Body Fat Result</Text>
                                     <View style={styles.previewValueContainer}>
                                         <Text style={styles.previewValue}>{previewResult.body_fat_percentage.toFixed(1)}</Text>
                                         <Text style={styles.previewUnit}>%</Text>
                                     </View>
                                     <Text style={styles.previewMethod}>Method: {previewResult.method}</Text>
                                 </View>
                             ) : null}

                             <View style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>Weight (kg)</Text>
                                 <TextInput
                                     style={styles.input}
                                     value={bfForm.weight}
                                     onChangeText={(text) => setBfForm(prev => ({ ...prev, weight: text }))}
                                     keyboardType="numeric"
                                     placeholder="Enter weight"
                                     placeholderTextColor={theme.colors.text.tertiary}
                                 />
                             </View>

                             <View style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>Waist (cm)</Text>
                                 <TextInput
                                     style={styles.input}
                                     value={bfForm.waist}
                                     onChangeText={(text) => setBfForm(prev => ({ ...prev, waist: text }))}
                                     keyboardType="numeric"
                                     placeholder="Enter waist measurement"
                                     placeholderTextColor={theme.colors.text.tertiary}
                                 />
                             </View>

                             <View style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>Neck (cm)</Text>
                                 <TextInput
                                     style={styles.input}
                                     value={bfForm.neck}
                                     onChangeText={(text) => setBfForm(prev => ({ ...prev, neck: text }))}
                                     keyboardType="numeric"
                                     placeholder="Enter neck measurement"
                                     placeholderTextColor={theme.colors.text.tertiary}
                                 />
                             </View>

                             {isFemale && (
                                 <View style={styles.inputGroup}>
                                     <Text style={styles.inputLabel}>Hips (cm)</Text>
                                     <TextInput
                                         style={styles.input}
                                         value={bfForm.hips}
                                         onChangeText={(text) => setBfForm(prev => ({ ...prev, hips: text }))}
                                         keyboardType="numeric"
                                         placeholder="Enter hips measurement"
                                         placeholderTextColor={theme.colors.text.tertiary}
                                     />
                                 </View>
                             )}

                             <View style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>Notes (optional)</Text>
                                 <TextInput
                                     style={[styles.input, styles.textArea]}
                                     value={bfForm.notes}
                                     onChangeText={(text) => setBfForm(prev => ({ ...prev, notes: text }))}
                                     placeholder="Add any notes"
                                     placeholderTextColor={theme.colors.text.tertiary}
                                     multiline
                                     numberOfLines={3}
                                 />
                             </View>

                             <View style={styles.sheetActions}>
                                 {previewResult ? (
                                     <>
                                         <TouchableOpacity 
                                             style={[styles.btnCancel, { flex: 1 }]} 
                                             onPress={() => setPreviewResult(null)}
                                         >
                                             <Text style={styles.btnText}>Recalculate</Text>
                                         </TouchableOpacity>
                                         <TouchableOpacity 
                                             style={[styles.btnSave, { flex: 1 }]} 
                                             onPress={() => handleCalculateBodyFat(false)}
                                             disabled={isProcessing}
                                         >
                                             <Text style={[styles.btnText, { color: '#FFF' }]}>
                                                 {isProcessing ? 'Saving...' : 'Save'}
                                             </Text>
                                         </TouchableOpacity>
                                     </>
                                 ) : (
                                     <TouchableOpacity 
                                         style={styles.btnSave} 
                                         onPress={() => handleCalculateBodyFat(true)}
                                         disabled={isProcessing}
                                     >
                                         <Text style={[styles.btnText, { color: '#FFF' }]}>
                                             {isProcessing ? 'Calculating...' : 'Calculate'}
                                         </Text>
                                     </TouchableOpacity>
                                 )}
                             </View>
                         </ScrollView>
                     </View>
                 </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: theme.spacing.m },

    // Headers
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xl },
    headerLeft: { flex: 1 },
    mainTitle: { ...typographyStyles.h3, marginBottom: theme.spacing.xs },
    addButton: { 
        
        width: 40, height: 40, borderRadius: theme.borderRadius.l, 
        backgroundColor: theme.colors.status.rest, alignItems: 'center', justifyContent: 'center' },


    // Cards    
    cardsRow: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.xl },
    biometricCard: { flex: 1, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, padding: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.ui.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.m },
    cardLabel: { ...typographyStyles.labelTight, },
    cardValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: theme.spacing.s },
    cardValue: { ...typographyStyles.h3, color: '#FFFFFF' },
    cardUnit: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginLeft: 4 },
    miniGraphContainer: { marginTop: theme.spacing.s }, 

    // Neural Trend Section
    neuralTrendSection: { marginBottom: theme.spacing.xl },
    neuralTrendHeader: { marginBottom: theme.spacing.m },
    neuralTrendTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: 4 },
    neuralTrendTitle: { fontSize: theme.typography.sizes.s, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
    legendContainer: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.s },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, fontWeight: '600', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    graphCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, padding: CHART_PADDING, borderWidth: 1, borderColor: theme.colors.ui.border, overflow: 'hidden' },
    emptyChart: { height: 180, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    emptyChartText: { color: theme.colors.text.secondary, marginTop: 8, fontSize: 12 },

    // History
    historySection: { marginTop: theme.spacing.m },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
    historySectionTitle: { ...typographyStyles.labelMuted },
    historyContainer: { gap: theme.spacing.m },
    historyCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.xl, 
        padding: theme.spacing.m, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border 
    },
    historyContent: { flex: 1 },
    historyDate: { 
        ...typographyStyles.labelTight, 
        color: theme.colors.text.secondary, 
        marginBottom: theme.spacing.s 
    },
    historyMetricsRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.l },
    historyMetric: { flexDirection: 'row', alignItems: 'baseline' },
    historyValue: { 
        ...typographyStyles.h3, 
        color: theme.colors.text.primary,
        fontWeight: '700'
    },
    historyUnit: { 
        ...typographyStyles.labelTight, 
        color: theme.colors.text.primary, 
        marginLeft: 4,
        opacity: 0.7
    },
    historyBfValue: { 
        ...typographyStyles.h3, 
        color: '#BF5AF2',
        fontWeight: '700'
    },
    historyBfUnit: { 
        ...typographyStyles.labelTight, 
        color: '#BF5AF2', 
        marginLeft: 4,
        opacity: 0.7
    },
    
    // Utilities
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    emptyText: { color: theme.colors.text.secondary, marginTop: 8 },
    deleteAction: { backgroundColor: theme.colors.status.error, width: 80, alignItems: 'center', justifyContent: 'center' },
    
    // Modal Styles (Kept consistent)
    modalOverlay: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: theme.spacing.l },
        modalCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.ui.border },
        modalTitle: { ...typographyStyles.h4, color: theme.colors.text.primary, marginBottom: theme.spacing.l },
    bigInputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: theme.spacing.xl },
    bigInput: { ...typographyStyles.h3, color: theme.colors.status.rest, minWidth: 60, textAlign: 'center' },
    bigInputSuffix: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginLeft: 8 },
    modalActions: { flexDirection: 'row', gap: theme.spacing.m, width: '100%' },
    btnCancel: { flex: 1, backgroundColor: theme.colors.ui.border, padding: theme.spacing.m, borderRadius: theme.borderRadius.xl, alignItems: 'center' },
    btnSave: { flex: 1, backgroundColor: theme.colors.status.rest, padding: theme.spacing.m, borderRadius: theme.borderRadius.xl, alignItems: 'center' },
    btnText: { ...typographyStyles.labelTight, color: theme.colors.text.primary },
     sheetContainer: { flex: 1, backgroundColor: theme.colors.background },
     sheetContent: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
     sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.border },
     sheetTitle: { ...typographyStyles.h4, color: theme.colors.text.primary },
     sheetScroll: { flex: 1, paddingHorizontal: theme.spacing.m },
     inputGroup: { marginBottom: theme.spacing.l },
     inputLabel: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginBottom: theme.spacing.s },
     input: { backgroundColor: theme.colors.ui.glass, borderWidth: 1, borderColor: theme.colors.ui.border, borderRadius: theme.borderRadius.xl, padding: theme.spacing.m, color: theme.colors.text.primary, fontSize: theme.typography.sizes.m },
     textArea: { minHeight: 80, textAlignVertical: 'top' },
     sheetActions: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.l, marginBottom: theme.spacing.xl },
     previewContainer: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, marginBottom: theme.spacing.l, borderWidth: 1, borderColor: theme.colors.ui.border, alignItems: 'center' },
     previewTitle: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginBottom: theme.spacing.m },
     previewValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: theme.spacing.s },
     previewValue: { ...typographyStyles.h2, color: theme.colors.status.rest },
     previewUnit: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginLeft: 4 },
     previewMethod: { ...typographyStyles.labelTight, color: theme.colors.text.tertiary, fontSize: 10 },
});