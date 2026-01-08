import { addUserSupplement, deleteSupplementLog, getSupplementLogs, getSupplements, getTodayLogs, getUserSupplements, logUserSupplement, Supplement, SupplementLog, UserSupplement } from '@/api/Supplements';
import { SwipeAction } from '@/components/SwipeAction';
import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. MAIN SCREEN
// ============================================================================

export default function SupplementsScreen() {
    const insets = useSafeAreaInsets();
    
    // --- Data State ---
    const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
    const [availableSupplements, setAvailableSupplements] = useState<Supplement[]>([]);
    const [todayLogsMap, setTodayLogsMap] = useState<Map<number, boolean>>(new Map());
    
    // --- UI State ---
    const [modals, setModals] = useState({ add: false, history: false });
    const [isLoading, setIsLoading] = useState(false);
    
    // --- Selection & Form State ---
    const [selectedSupp, setSelectedSupp] = useState<UserSupplement | null>(null);
    const [viewingLogs, setViewingLogs] = useState<SupplementLog[]>([]);
    
    const [addStep, setAddStep] = useState<1 | 2>(1);
    const [newSuppData, setNewSuppData] = useState<{
        base: Supplement | null,
        dosage: string,
        freq: string,
        time: string
    }>({ base: null, dosage: '', freq: 'daily', time: '' });

    // --- Loading ---

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [userData, allData, todayData] = await Promise.all([
                getUserSupplements(),
                getSupplements(),
                getTodayLogs()
            ]);
            
            setUserSupplements(userData);
            setAvailableSupplements(allData);
            
            const logMap = new Map<number, boolean>();
            if (todayData?.logs) {
                todayData.logs.forEach(log => {
                    if (log.user_supplement_id) {
                        logMap.set(log.user_supplement_id, true);
                    }
                });
            }
            setTodayLogsMap(logMap);
        } catch (e) { console.error(e); }
    };

    const loadLogs = async (id: number) => {
        setIsLoading(true);
        try {
            const logs = await getSupplementLogs(id);
            setViewingLogs(logs);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    // --- Actions ---

    const handleLog = async (item: UserSupplement) => {
        // Immediate feedback
        const now = new Date();
        const result = await logUserSupplement({
            user_supplement_id: item.id,
            date: now.toISOString().split('T')[0],
            time: `${now.getHours()}:${now.getMinutes()}:00`,
            dosage: item.dosage
        });

        if (result) {
            loadData();
        } else {
            Alert.alert("Error", "Failed to log.");
        }
    };

    const handleAddSubmit = async () => {
        if (!newSuppData.base || !newSuppData.dosage) return;
        
        const result = await addUserSupplement({
            supplement_id: newSuppData.base.id,
            dosage: parseFloat(newSuppData.dosage),
            frequency: newSuppData.freq,
            time_of_day: newSuppData.time
        });

        if (result) {
            setModals(m => ({ ...m, add: false }));
            setAddStep(1);
            setNewSuppData({ base: null, dosage: '', freq: 'daily', time: '' });
            loadData();
        }
    };

    const openHistory = (item: UserSupplement) => {
        setSelectedSupp(item);
        setModals(m => ({ ...m, history: true }));
        loadLogs(item.id);
    };

    const handleDeleteLog = async (logId: number) => {
        await deleteSupplementLog(logId);
        if (selectedSupp) loadLogs(selectedSupp.id);
        loadData();
    };

    // --- Helper Functions ---
    
    const getSupplementBenefit = (name: string): string => {
        const nameUpper = name.toUpperCase();
        if (nameUpper.includes('CREATINE')) return 'PERFORMANCE';
        if (nameUpper.includes('WHEY') || nameUpper.includes('PROTEIN')) return 'PROTEIN';
        if (nameUpper.includes('VITAMIN')) return 'NUTRITION';
        if (nameUpper.includes('OMEGA') || nameUpper.includes('FISH')) return 'HEALTH';
        return 'WELLNESS';
    };

    const getLoggedCount = (): number => {
        let count = 0;
        todayLogsMap.forEach((logged) => {
            if (logged) count++;
        });
        return count;
    };

    // --- Render Items ---

    const renderItem = ({ item }: { item: UserSupplement }) => {
        const isLogged = todayLogsMap.get(item.id);
        const benefit = getSupplementBenefit(item.supplement_details.name);

        return (
            <TouchableOpacity 
                style={styles.supplementCard} 
                activeOpacity={0.7}
                onPress={() => openHistory(item)}
            >
                <View style={styles.supplementIcon}>
                    <Ionicons name="medical-outline" size={24} color={theme.colors.text.secondary} />
                </View>
                <View style={styles.supplementInfo}>
                    <Text style={styles.supplementName}>{item.supplement_details.name.toUpperCase()}</Text>
                    <Text style={styles.supplementDetails}>
                        {item.dosage}{item.supplement_details.dosage_unit.toUpperCase()} • {benefit}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={[styles.logButton, isLogged && styles.logButtonDone]}
                    onPress={() => !isLogged && handleLog(item)}
                    activeOpacity={0.8}
                    disabled={isLogged}
                >
                    <Text style={[styles.logButtonText, isLogged && styles.logButtonTextDone]}>
                        {isLogged ? "LOGGED" : "LOG"}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const loggedCount = getLoggedCount();
    const totalCount = userSupplements.length;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.mainTitle}>SUPPLEMENT STACK</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setModals(m => ({ ...m, add: true }))}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Today's Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressLeft}>
                        <Text style={styles.progressLabel}>TODAY'S PROGRESS</Text>
                        <View style={styles.progressCount}>
                            <Text style={styles.progressNumber}>{loggedCount}/{totalCount}</Text>
                            <Text style={styles.progressText}> LOGGED</Text>
                        </View>
                    </View>
                    <View style={styles.progressIcon}>
                        <View style={styles.progressIconContainer}>
                            <Ionicons name="sparkles" size={24} color={theme.colors.status.active} />
                        </View>
                    </View>
                </View>

                {userSupplements.length > 0 && (
                    <>
                        <Text style={styles.sectionHeader}>ACTIVE</Text>
                        {userSupplements.map((item) => (
                            <View key={item.id.toString()}>
                                {renderItem({ item })}
                            </View>
                        ))}
                    </>
                )}

                {userSupplements.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="nutrition" size={32} color="#8E8E93" />
                        </View>
                        <Text style={styles.emptyTitle}>No Supplements</Text>
                        <Text style={styles.emptyText}>Add supplements to track your daily intake.</Text>
                    </View>
                )}
            </ScrollView>

            <Modal visible={modals.add} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {addStep === 1 ? "Add Supplement" : "Details"}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setModals(m => ({ ...m, add: false }));
                            setAddStep(1);
                        }}>
                            <Ionicons name="close-circle" size={30} color="#3A3A3C" />
                        </TouchableOpacity>
                    </View>

                    {addStep === 1 ? (
                        // Step 1: List
                        <FlatList
                            data={availableSupplements}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.selectionRow}
                                    onPress={() => {
                                        setNewSuppData(prev => ({ 
                                            ...prev, 
                                            base: item, 
                                            dosage: item.default_dosage?.toString() || '' 
                                        }));
                                        setAddStep(2);
                                    }}
                                >
                                    <Text style={styles.selectionText}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#545458" />
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        // Step 2: Form
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <ScrollView contentContainerStyle={styles.formContent}>
                                <View style={styles.previewBanner}>
                                    <Text style={styles.previewText}>{newSuppData.base?.name}</Text>
                                    <TouchableOpacity onPress={() => setAddStep(1)}>
                                        <Text style={styles.changeLink}>Change</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>DOSAGE ({newSuppData.base?.dosage_unit})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newSuppData.dosage}
                                    onChangeText={t => setNewSuppData(p => ({ ...p, dosage: t }))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#545458"
                                    autoFocus
                                />

                                <Text style={styles.label}>FREQUENCY</Text>
                                <View style={styles.pillRow}>
                                    {['Daily', 'Weekly'].map(f => (
                                        <TouchableOpacity 
                                            key={f}
                                            style={[styles.pill, newSuppData.freq.toLowerCase() === f.toLowerCase() && styles.pillActive]}
                                            onPress={() => setNewSuppData(p => ({ ...p, freq: f.toLowerCase() }))}
                                        >
                                            <Text style={[styles.pillText, newSuppData.freq.toLowerCase() === f.toLowerCase() && styles.pillTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.label}>TIME OF DAY (OPTIONAL)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newSuppData.time}
                                    onChangeText={t => setNewSuppData(p => ({ ...p, time: t }))}
                                    placeholder="Morning, Pre-workout..."
                                    placeholderTextColor="#545458"
                                />

                                <TouchableOpacity style={styles.saveButton} onPress={handleAddSubmit}>
                                    <Text style={styles.saveButtonText}>Add Supplement</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    )}
                </View>
            </Modal>

            <Modal visible={modals.history} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{selectedSupp?.supplement_details.name} Logs</Text>
                            <Text style={styles.modalSubtitle}>History</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModals(m => ({ ...m, history: false }))}>
                            <Ionicons name="close-circle" size={30} color={theme.colors.text.zinc600} />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={theme.colors.status.active} />
                        </View>
                    ) : (
                        <FlatList
                            data={viewingLogs}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <ReanimatedSwipeable
                                    renderRightActions={(p, d) => (
                                        <SwipeAction 
                                            progress={p} 
                                            dragX={d} 
                                            onPress={() => handleDeleteLog(item.id)} 
                                            iconName="trash-outline"
                                            side="right"
                                        />
                                    )}
                                    friction={2}
                                    enableTrackpadTwoFingerGesture
                                    rightThreshold={40}
                                >
                                    <View style={[styles.logRow, index === viewingLogs.length - 1 && styles.logRowLast]}>
                                        <Text style={styles.logDate}>
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.logDetail}>
                                                {item.time.substring(0, 5)}
                                            </Text>
                                            <Text style={styles.logDosage}>
                                                {item.dosage} {selectedSupp?.supplement_details.dosage_unit}
                                            </Text>
                                        </View>
                                    </View>
                                </ReanimatedSwipeable>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No logs found.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrollContent: { padding: theme.spacing.m },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    headerLeft: {
        flex: 1,
    },
    mainTitle: {
        ...typographyStyles.h3,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.status.rest,
        letterSpacing: theme.typography.tracking.wider,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.m,
        backgroundColor: theme.colors.status.rest,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Progress Card
    progressCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        padding: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        marginBottom: theme.spacing.xxl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    progressLeft: {
        flex: 1,
    },
    progressLabel: {
        ...typographyStyles.labelMuted,
        marginBottom: theme.spacing.s,
    },
    progressCount: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    progressNumber: {
        ...typographyStyles.data,
        fontSize: theme.typography.sizes.xxxl,
    },
    progressText: {
        fontSize: theme.typography.sizes.s,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    progressIcon: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${theme.colors.status.active}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Section Header
    sectionHeader: {
        ...typographyStyles.labelMuted,
        marginBottom: theme.spacing.m,
    },

    // Supplement Card
    supplementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        marginBottom: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    supplementIcon: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.s,
    },
    supplementInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    supplementName: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.xs,
        letterSpacing: theme.typography.tracking.tight,
    },
    supplementDetails: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '500',
        color: theme.colors.text.secondary,
        letterSpacing: theme.typography.tracking.wider,
    },

    // Log Button
    logButton: {
        backgroundColor: theme.colors.status.rest,
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.m,
    },
    logButtonDone: {
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.status.success,
    },
    logButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wider,
    },
    logButtonTextDone: {
        color: theme.colors.status.success,
    },

    // Empty State
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { 
        width: 60, height: 60, borderRadius: 30, 
        backgroundColor: theme.colors.ui.glass, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.m 
    },
    emptyTitle: { fontSize: theme.typography.sizes.l, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.s },
    emptyText: { fontSize: theme.typography.sizes.m, color: theme.colors.text.secondary, textAlign: 'center' },

    // Modals
    modalContainer: { flex: 1, backgroundColor: theme.colors.ui.glass },
    modalHeader: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        padding: theme.spacing.l, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.border 
    },
    modalTitle: { fontSize: theme.typography.sizes.m, fontWeight: '600', color: theme.colors.text.primary },
    modalSubtitle: { fontSize: theme.typography.sizes.s, color: theme.colors.text.secondary },

    // Selection List
    selectionRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: theme.spacing.m, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.ui.border
    },
    selectionText: { fontSize: theme.typography.sizes.m, color: theme.colors.text.primary },

    // Form
    formContent: { padding: theme.spacing.l },
    previewBanner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: theme.colors.ui.glass, padding: theme.spacing.m, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.xl,
        borderWidth: 1, borderColor: theme.colors.ui.border
    },
    previewText: { fontSize: theme.typography.sizes.m, fontWeight: '600', color: theme.colors.text.primary },
    changeLink: { color: theme.colors.status.active, fontSize: theme.typography.sizes.m },
    
    label: { color: theme.colors.text.secondary, fontSize: theme.typography.sizes.s, fontWeight: '600', marginBottom: theme.spacing.s },
    input: {
        backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.m, padding: theme.spacing.m,
        fontSize: theme.typography.sizes.m, color: theme.colors.text.primary, marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    pillRow: { flexDirection: 'row', gap: theme.spacing.s, marginBottom: theme.spacing.xl },
    pill: {
        flex: 1, padding: theme.spacing.s, borderRadius: theme.borderRadius.m, backgroundColor: theme.colors.ui.glass,
        borderWidth: 1, borderColor: theme.colors.ui.border, alignItems: 'center'
    },
    pillActive: { backgroundColor: theme.colors.status.active, borderColor: theme.colors.status.active },
    pillText: { color: theme.colors.text.secondary, fontWeight: '600' },
    pillTextActive: { color: theme.colors.text.primary },
    saveButton: { backgroundColor: theme.colors.status.active, padding: theme.spacing.m, borderRadius: theme.borderRadius.l, alignItems: 'center', marginTop: theme.spacing.s },
    saveButtonText: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m, fontWeight: '600' },

    // Logs
    logRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.m, backgroundColor: theme.colors.ui.glass, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.ui.border
    },
    logRowLast: { borderBottomWidth: 0 },
    logDate: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m },
    logDetail: { color: theme.colors.text.secondary, fontSize: theme.typography.sizes.m },
    logDosage: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m, fontWeight: '500' },
    
    loadingContainer: { padding: 40, alignItems: 'center' },
});