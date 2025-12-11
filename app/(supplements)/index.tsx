import { addUserSupplement, getSupplements, getUserSupplements, Supplement, UserSupplement } from '@/api/Supplements';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupplementsScreen() {
    const insets = useSafeAreaInsets();
    const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
    const [availableSupplements, setAvailableSupplements] = useState<Supplement[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timeOfDay, setTimeOfDay] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [userData, allData] = await Promise.all([
            getUserSupplements(),
            getSupplements()
        ]);
        setUserSupplements(userData);
        setAvailableSupplements(allData);
    };

    const handleAddSupplement = async () => {
        if (!selectedSupplement || !dosage) return;

        const result = await addUserSupplement({
            supplement_id: selectedSupplement.id,
            dosage: parseFloat(dosage),
            frequency,
            time_of_day: timeOfDay
        });

        if (result) {
            setIsAddModalVisible(false);
            resetForm();
            loadData();
        }
    };

    const resetForm = () => {
        setSelectedSupplement(null);
        setDosage('');
        setFrequency('daily');
        setTimeOfDay('');
    };

    const renderUserSupplement = ({ item }: { item: UserSupplement }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.supplement_details.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.frequency}</Text>
                </View>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                    <Ionicons name="medical" size={16} color="#8E8E93" />
                    <Text style={styles.infoText}>
                        {item.dosage} {item.supplement_details.dosage_unit}
                    </Text>
                </View>
                {item.time_of_day && (
                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#8E8E93" />
                        <Text style={styles.infoText}>{item.time_of_day}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
                <Text style={styles.title}>My Stack</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={userSupplements}
                renderItem={renderUserSupplement}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="nutrition-outline" size={64} color="#8E8E93" />
                        <Text style={styles.emptyText}>No supplements added yet</Text>
                        <Text style={styles.emptySubtext}>Add supplements to track your intake</Text>
                    </View>
                }
            />

            <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={styles.fabButton}
                    onPress={() => setIsAddModalVisible(true)}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Supplement</Text>
                        <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                            <Text style={styles.closeButton}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {!selectedSupplement ? (
                            <>
                                <Text style={styles.sectionTitle}>Select Supplement</Text>
                                {availableSupplements.map(supp => (
                                    <TouchableOpacity 
                                        key={supp.id}
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setSelectedSupplement(supp);
                                            setDosage(supp.default_dosage?.toString() || '');
                                        }}
                                    >
                                        <Text style={styles.optionTitle}>{supp.name}</Text>
                                        <Text style={styles.optionSubtitle}>{supp.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <>
                                <View style={styles.selectedHeader}>
                                    <Text style={styles.selectedTitle}>{selectedSupplement.name}</Text>
                                    <TouchableOpacity onPress={() => setSelectedSupplement(null)}>
                                        <Text style={styles.changeButton}>Change</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Dosage ({selectedSupplement.dosage_unit})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dosage}
                                    onChangeText={setDosage}
                                    keyboardType="numeric"
                                    placeholder="Enter amount"
                                    placeholderTextColor="#8E8E93"
                                />

                                <Text style={styles.label}>Frequency</Text>
                                <View style={styles.pillContainer}>
                                    {['daily', 'weekly'].map(freq => (
                                        <TouchableOpacity
                                            key={freq}
                                            style={[
                                                styles.pill,
                                                frequency === freq && styles.pillActive
                                            ]}
                                            onPress={() => setFrequency(freq)}
                                        >
                                            <Text style={[
                                                styles.pillText,
                                                frequency === freq && styles.pillTextActive
                                            ]}>
                                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.label}>Time of Day (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={timeOfDay}
                                    onChangeText={setTimeOfDay}
                                    placeholder="e.g. Morning, With meals"
                                    placeholderTextColor="#8E8E93"
                                />

                                <TouchableOpacity 
                                    style={styles.saveButton}
                                    onPress={handleAddSupplement}
                                >
                                    <Text style={styles.saveButtonText}>Add to Stack</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 40,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Extra padding for FAB
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
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        color: '#0A84FF',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    cardContent: {
        flexDirection: 'row',
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#8E8E93',
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
    fabContainer: {
        position: 'absolute',
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
        backgroundColor: '#1C1C1E',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
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
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    optionItem: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        marginBottom: 1,
        borderRadius: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    selectedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    selectedTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    changeButton: {
        fontSize: 15,
        color: '#0A84FF',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
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
    pillContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    pillActive: {
        backgroundColor: '#0A84FF',
        borderColor: '#0A84FF',
    },
    pillText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    pillTextActive: {
        color: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: '#0A84FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
