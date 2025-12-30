import { addUserSupplement, deleteSupplementLog, getSupplementLogs, getSupplements, getTodayLogs, getUserSupplements, logUserSupplement, Supplement, SupplementLog, UserSupplement } from '@/api/Supplements';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupplementsScreen() {
    const insets = useSafeAreaInsets();
    const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
    const [availableSupplements, setAvailableSupplements] = useState<Supplement[]>([]);
    const [todayLogsMap, setTodayLogsMap] = useState<Map<number, boolean>>(new Map()); // Map of user_supplement_id -> isLoggedToday
    const [viewingLogs, setViewingLogs] = useState<SupplementLog[]>([]); // For the logs modal
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isLogModalVisible, setIsLogModalVisible] = useState(false);
    const [isLogsModalVisible, setIsLogsModalVisible] = useState(false);
    const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
    const [selectedUserSupplement, setSelectedUserSupplement] = useState<UserSupplement | null>(null);
    const [selectedUserSupplementForLogs, setSelectedUserSupplementForLogs] = useState<UserSupplement | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timeOfDay, setTimeOfDay] = useState('');
    const [logDate, setLogDate] = useState('');
    const [logTime, setLogTime] = useState('');
    const [logDosage, setLogDosage] = useState('');

    useEffect(() => {
        loadData();
        loadTodayLogsStatus();
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Refresh today's logs status when screen comes into focus
            loadTodayLogsStatus();
        }, [])
    );

    const loadData = async () => {
        const [userData, allData] = await Promise.all([
            getUserSupplements(),
            getSupplements()
        ]);
        setUserSupplements(userData);
        setAvailableSupplements(allData);
        // Load today's logs to show indicators
        loadTodayLogsStatus();
    };

    const loadTodayLogsStatus = async () => {
        try {
            const todayLogsResponse = await getTodayLogs();
            if (todayLogsResponse && todayLogsResponse.logs) {
                // Create a map of user_supplement_id -> true for all supplements logged today
                const loggedTodayMap = new Map<number, boolean>();
                todayLogsResponse.logs.forEach(log => {
                    loggedTodayMap.set(log.id, true);
                });
                setTodayLogsMap(loggedTodayMap);
            } else {
                setTodayLogsMap(new Map());
            }
        } catch (error) {
            console.error('Error loading today logs:', error);
            setTodayLogsMap(new Map());
        } 
    };

    const loadLogsForSupplement = async (userSupplementId: number) => {
        setIsLoadingLogs(true);
        try {
            const logs = await getSupplementLogs(userSupplementId);
            setViewingLogs(logs);
        } catch (error) {
            console.error('Error loading logs:', error);
            setViewingLogs([]);
        } finally {
            setIsLoadingLogs(false);
        }
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

    const resetLogForm = () => {
        setSelectedUserSupplement(null);
        setLogDate('');
        setLogTime('');
        setLogDosage('');
    };

    const handleLogSupplement = (userSupplement: UserSupplement) => {
        setSelectedUserSupplement(userSupplement);
        const now = new Date();
        setLogDate(now.toISOString().split('T')[0]);
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setLogTime(`${hours}:${minutes}`);
        setLogDosage(userSupplement.dosage.toString());
        setIsLogModalVisible(true);
    };

    const handleSaveLog = async () => {
        if (!selectedUserSupplement || !logDate || !logTime || !logDosage) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        const result = await logUserSupplement({
            user_supplement_id: selectedUserSupplement.id,
            date: logDate,
            time: `${logTime}:00`,
            dosage: parseFloat(logDosage)
        });

        if (result) {
            setIsLogModalVisible(false);
            resetLogForm();
            loadData();
            // Refresh today's logs status and viewing logs if applicable
            loadTodayLogsStatus();
            if (selectedUserSupplementForLogs && selectedUserSupplementForLogs.id === selectedUserSupplement.id) {
                loadLogsForSupplement(selectedUserSupplement.id);
            }
            Alert.alert("Success", "Supplement logged successfully");
        } else {
            Alert.alert("Error", "Failed to log supplement");
        }
    };

    const handleDeleteLog = async (logId: number) => {
        Alert.alert(
            "Delete Log",
            "Are you sure you want to delete this log entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteSupplementLog(logId);
                        if (success) {
                            // Refresh today's logs status
                            loadTodayLogsStatus();
                            // Refresh logs for the current supplement
                            if (selectedUserSupplementForLogs) {
                                loadLogsForSupplement(selectedUserSupplementForLogs.id);
                            }
                        } else {
                            Alert.alert("Error", "Failed to delete log entry");
                        }
                    }
                }
            ]
        );
    };

    const formatDateTime = (date: string, time: string) => {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderUserSupplement = ({ item }: { item: UserSupplement }) => {
        // Check if logged today from the map
        const isLoggedToday = todayLogsMap.get(item.id) || false;

        return (
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
                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={[styles.logButton, isLoggedToday && styles.logButtonLogged]}
                        onPress={async () => {
                            await handleLogSupplement(item);
                            // Refresh today's logs status after logging
                            loadTodayLogsStatus();
                        }}
                    >
                        <Ionicons 
                            name={isLoggedToday ? "checkmark-circle" : "add-circle-outline"} 
                            size={18} 
                            color={isLoggedToday ? "#32D74B" : "#0A84FF"} 
                        />
                        <Text style={[styles.logButtonText, isLoggedToday && styles.logButtonTextLogged]}>
                            {isLoggedToday ? "Logged Today" : "Log"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.viewLogsButton}
                        onPress={async () => {
                            setSelectedUserSupplementForLogs(item);
                            setIsLogsModalVisible(true);
                            await loadLogsForSupplement(item.id);
                        }}
                    >
                        <Ionicons name="list-outline" size={18} color="#8E8E93" />
                        <Text style={styles.viewLogsButtonText}>View Logs</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10}]}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <UnifiedHeader 
                title="My Stack"
                rightButton={{
                    icon: "add",
                    onPress: () => setIsAddModalVisible(true),
                }}
                modalContent={
                    <ScrollView style={styles.modalScrollContent}>
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
                }
                modalVisible={isAddModalVisible}
                onModalClose={() => {
                    setIsAddModalVisible(false);
                    resetForm();
                }}
            />

            <FlatList
                data={userSupplements}
                renderItem={renderUserSupplement}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingTop: 60 }]}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="nutrition-outline" size={64} color="#8E8E93" />
                        <Text style={styles.emptyText}>No supplements added yet</Text>
                        <Text style={styles.emptySubtext}>Add supplements to track your intake</Text>
                    </View>
                }
            />

            {/* Log Supplement Modal */}
            <Modal
                visible={isLogModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setIsLogModalVisible(false);
                    resetLogForm();
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
                        <Text style={styles.modalTitle}>Log Supplement</Text>
                        <TouchableOpacity onPress={() => {
                            setIsLogModalVisible(false);
                            resetLogForm();
                        }}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScrollContent} contentContainerStyle={styles.modalContent}>
                        {selectedUserSupplement && (
                            <>
                                <Text style={styles.logSupplementName}>{selectedUserSupplement.supplement_details.name}</Text>
                                
                                <Text style={styles.label}>Date</Text>
                                <TextInput
                                    style={styles.input}
                                    value={logDate}
                                    onChangeText={setLogDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#8E8E93"
                                />

                                <Text style={styles.label}>Time</Text>
                                <TextInput
                                    style={styles.input}
                                    value={logTime}
                                    onChangeText={setLogTime}
                                    placeholder="HH:MM (e.g., 08:00)"
                                    placeholderTextColor="#8E8E93"
                                />

                                <Text style={styles.label}>Dosage ({selectedUserSupplement.supplement_details.dosage_unit})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={logDosage}
                                    onChangeText={setLogDosage}
                                    keyboardType="numeric"
                                    placeholder={selectedUserSupplement.dosage.toString()}
                                    placeholderTextColor="#8E8E93"
                                />

                                <TouchableOpacity 
                                    style={styles.saveButton}
                                    onPress={handleSaveLog}
                                >
                                    <Text style={styles.saveButtonText}>Log Supplement</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* View Logs Modal */}
            <Modal
                visible={isLogsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setIsLogsModalVisible(false);
                    setSelectedUserSupplementForLogs(null);
                    setViewingLogs([]);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
                        <View style={styles.modalHeaderContent}>
                            <Text style={styles.modalTitle}>
                                {selectedUserSupplementForLogs?.supplement_details.name || 'Supplement'} Logs
                            </Text>
                            {selectedUserSupplementForLogs && (
                                <Text style={styles.modalSubtitle}>
                                    {selectedUserSupplementForLogs.dosage} {selectedUserSupplementForLogs.supplement_details?.dosage_unit || 'units'}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => {
                            setIsLogsModalVisible(false);
                            setSelectedUserSupplementForLogs(null);
                            setViewingLogs([]);
                        }}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    {isLoadingLogs ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading logs...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={viewingLogs}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.logsListContent}
                            renderItem={({ item }) => {
                                const dosageUnit = item.user_supplement?.supplement_details?.dosage_unit || 
                                                  selectedUserSupplementForLogs?.supplement_details?.dosage_unit || 
                                                  'units';
                                return (
                                    <View style={styles.logItem}>
                                        <View style={styles.logItemLeft}>
                                            <Text style={styles.logItemDateTime}>
                                                {formatDateTime(item.date, item.time)}
                                            </Text>
                                        </View>
                                        <View style={styles.logItemRight}>
                                            <Text style={styles.logItemDosage}>
                                                {item.dosage} {dosageUnit}
                                            </Text>
                                            <TouchableOpacity 
                                                onPress={async () => {
                                                    await handleDeleteLog(item.id);
                                                    if (selectedUserSupplementForLogs) {
                                                        loadLogsForSupplement(selectedUserSupplementForLogs.id);
                                                    }
                                                }}
                                                style={styles.deleteLogButton}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="list-outline" size={48} color="#8E8E93" />
                                    <Text style={styles.emptyText}>No logs yet</Text>
                                    <Text style={styles.emptySubtext}>Log when you take this supplement</Text>
                                </View>
                            }
                            refreshing={isLoadingLogs}
                            onRefresh={() => {
                                if (selectedUserSupplementForLogs) {
                                    loadLogsForSupplement(selectedUserSupplementForLogs.id);
                                }
                            }}
                        />
                    )}
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
    listContent: {
        padding: 16,
        paddingBottom: 96,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 13,
        color: '#0A84FF',
        fontWeight: '300',
        textTransform: 'capitalize',
    },
    cardContent: {
        flexDirection: 'row',
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 17,
        color: '#8E8E93',
        marginTop: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    modalHeaderContent: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 8,
        fontWeight: '300',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    closeButton: {
        fontSize: 17,
        color: '#0A84FF',
        fontWeight: '400',
    },
    modalContent: {
        padding: 24,
    },
    modalScrollContent: {
        maxHeight: 500,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '300',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginBottom: 16,
        marginLeft: 8,
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
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '300',
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
        fontSize: 17,
        color: '#0A84FF',
        fontWeight: '400',
    },
    label: {
        fontSize: 13,
        fontWeight: '300',
        color: '#8E8E93',
        marginBottom: 16,
        marginLeft: 8,
    },
    input: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 22,
        marginBottom: 24,
        fontSize: 17,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        fontWeight: '400',
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
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
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    pillTextActive: {
        color: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: '#0A84FF',
        padding: 16,
        borderRadius: 22,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    logButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#0A84FF',
    },
    logButtonLogged: {
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        borderColor: '#32D74B',
    },
    logButtonText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#0A84FF',
    },
    logButtonTextLogged: {
        color: '#32D74B',
    },
    viewLogsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    viewLogsButtonText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
    },
    logSupplementName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
    },
    logsListContent: {
        padding: 24,
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    logItemLeft: {
        flex: 1,
    },
    logItemName: {
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    logItemDateTime: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '300',
    },
    logItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    logItemDosage: {
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
    },
    deleteLogButton: {
        padding: 4,
    },
});
