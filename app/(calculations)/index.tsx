import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { updateHeight } from '@/api/account';
import { BodyMeasurement, CalculateBodyFatResponse, CreateMeasurementRequest } from '@/api/types';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CalculationsScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser } = useUserStore();
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isHeightModalVisible, setIsHeightModalVisible] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSavingHeight, setIsSavingHeight] = useState(false);
    const [previewResult, setPreviewResult] = useState<CalculateBodyFatResponse | null>(null);
    const [tempHeight, setTempHeight] = useState('');
    
    // Form state
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
            loadMeasurements();
        }, [])
    );

    const loadMeasurements = async () => {
        setIsLoading(true);
        try {
            const data = await getMeasurements();
            if (Array.isArray(data)) {
                setMeasurements(data);
            }
        } catch (error) {
            console.error('Failed to load measurements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        if (!userHeight) {
            setIsHeightModalVisible(true);
            setTempHeight('');
        } else {
            resetForm();
            setIsModalVisible(true);
        }
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
                resetForm();
                setIsModalVisible(true);
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to save height");
        } finally {
            setIsSavingHeight(false);
        }
    };

    const handleCancelHeight = () => {
        setIsHeightModalVisible(false);
        router.back();
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

    const handleSave = async () => {
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
                setIsModalVisible(false);
                loadMeasurements();
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

    const renderMeasurement = ({ item }: { item: BodyMeasurement }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                {item.body_fat_percentage && (
                    <View style={styles.bfBadge}>
                        <Text style={styles.bfText}>
                            {parseFloat(String(item.body_fat_percentage)).toFixed(1)}%
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Weight:</Text>
                    <Text style={styles.measurementValue}>{item.weight} kg</Text>
                </View>
                <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Height:</Text>
                    <Text style={styles.measurementValue}>{item.height} cm</Text>
                </View>
                <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Waist:</Text>
                    <Text style={styles.measurementValue}>{item.waist} cm</Text>
                </View>
                <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Neck:</Text>
                    <Text style={styles.measurementValue}>{item.neck} cm</Text>
                </View>
                {item.hips && (
                    <View style={styles.measurementRow}>
                        <Text style={styles.measurementLabel}>Hips:</Text>
                        <Text style={styles.measurementValue}>{item.hips} cm</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader 
                title="Body Measurements"
                rightButton={{
                    icon: "add",
                    onPress: () => handleOpenAddModal(),
                }}
                modalContent={
                    <ScrollView style={styles.modalScrollContent}>
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
                                onPress={handleSave}
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
                }
                modalVisible={isModalVisible}
                onModalClose={() => {
                    setIsModalVisible(false);
                    resetForm();
                }}
            />

            {isLoading && measurements.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={measurements}
                    renderItem={renderMeasurement}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.listContent, { paddingTop: 60 }]}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="body-outline" size={64} color="#8E8E93" />
                            <Text style={styles.emptyText}>No measurements yet</Text>
                            <Text style={styles.emptySubtext}>Add your first measurement to track progress</Text>
                        </View>
                    }
                />
            )}

            {/* Height Modal */}
            <Modal
                visible={isHeightModalVisible}
                animationType="fade"
                transparent
                onRequestClose={handleCancelHeight}
            >
                <View style={styles.heightModalOverlay}>
                    <View style={styles.heightModalContent}>
                        <Text style={styles.heightModalTitle}>Set Your Height</Text>
                        <Text style={styles.heightModalSubtitle}>
                            You need to set your height before adding measurements
                        </Text>
                        <TextInput
                            style={styles.heightInput}
                            value={tempHeight}
                            onChangeText={setTempHeight}
                            keyboardType="numeric"
                            placeholder="175"
                            placeholderTextColor="#8E8E93"
                        />
                        <View style={styles.heightButtonRow}>
                            <TouchableOpacity 
                                style={[styles.heightButton, styles.heightButtonCancel]}
                                onPress={handleCancelHeight}
                            >
                                <Text style={styles.heightButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.heightButton, styles.heightButtonSave]}
                                onPress={handleSaveHeight}
                                disabled={isSavingHeight}
                            >
                                {isSavingHeight ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.heightButtonSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardDate: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    bfBadge: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bfText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A84FF',
    },
    cardContent: {
        gap: 8,
    },
    measurementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    measurementLabel: {
        fontSize: 14,
        color: '#8E8E93',
    },
    measurementValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
    modalScrollContent: {
        maxHeight: 500,
    },
    heightModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    heightModalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    heightModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    heightModalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 24,
        textAlign: 'center',
    },
    heightInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        padding: 18,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '500',
        marginBottom: 24,
        textAlign: 'center',
    },
    heightButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    heightButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    heightButtonCancel: {
        backgroundColor: '#2C2C2E',
    },
    heightButtonSave: {
        backgroundColor: '#0A84FF',
    },
    heightButtonCancelText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    heightButtonSaveText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    closeButton: {
        fontSize: 17,
        color: '#0A84FF',
        fontWeight: '600',
    },
    modalContent: {
        padding: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
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
    input: {
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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

