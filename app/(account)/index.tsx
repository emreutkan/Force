import { changePassword, updateGender, updateHeight } from '@/api/account';
import { clearTokens } from '@/api/Storage';
import { getWorkouts } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. REUSABLE COMPONENTS
// ============================================================================

/**
 * A grouped section container, similar to iOS Settings groups.
 * Renders a title (optional) and a rounded container for rows.
 */
const SettingsSection = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <View style={styles.sectionContainer}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

/**
 * A single row inside a SettingsSection.
 * Handles icons, labels, values, and chevron logic automatically.
 */
interface SettingsRowProps {
    label: string;
    value?: string | null;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    onPress: () => void;
    isDestructive?: boolean; // If true, styles text red (e.g., Logout)
    showChevron?: boolean;
    isLast?: boolean; // Removes the bottom border if it's the last item
}

const SettingsRow = ({ 
    label, 
    value, 
    icon, 
    iconColor = '#0A84FF', 
    onPress, 
    isDestructive = false,
    showChevron = true,
    isLast = false
}: SettingsRowProps) => (
    <TouchableOpacity 
        style={[styles.row, isLast && styles.rowLast]} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowLeft}>
            {icon && (
                <View style={[styles.iconContainer, { backgroundColor: isDestructive ? 'rgba(255,59,48,0.15)' : 'rgba(10,132,255,0.15)' }]}>
                    <Ionicons name={icon} size={18} color={isDestructive ? '#FF3B30' : iconColor} />
                </View>
            )}
            <Text style={[styles.rowLabel, isDestructive && styles.rowLabelDestructive]}>
                {label}
            </Text>
        </View>
        
        <View style={styles.rowRight}>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {showChevron && <Ionicons name="chevron-forward" size={16} color="#545458" style={{ marginLeft: 8 }} />}
        </View>
    </TouchableOpacity>
);

// ============================================================================
// 2. MAIN SCREEN COMPONENT
// ============================================================================

export default function AccountScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser, clearUser } = useUserStore();
    
    // --- State Management ---
    const [sessionsCount, setSessionsCount] = useState(0);
    const [totalVolume, setTotalVolume] = useState(0);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    
    // Controls visibility of the 3 modals
    const [modals, setModals] = useState({
        height: false,
        gender: false,
        password: false,
    });
    
    // Loading state for async operations
    const [isSaving, setIsSaving] = useState(false);

    // Form data buffer (avoids changing user store directly before save)
    const [formData, setFormData] = useState({
        height: '',
        gender: 'male' as 'male' | 'female',
        oldPassword: '',
        newPassword: '',
    });

    // --- Effects ---

    // Fetch user and stats
    const fetchStats = useCallback(async () => {
        try {
            setIsLoadingStats(true);
            const workoutsData = await getWorkouts(1, 1000); // Get a large page to calculate totals
            if (workoutsData?.results) {
                const workouts = workoutsData.results;
                setSessionsCount(workouts.length);
                
                // Calculate total volume
                const volume = workouts.reduce((sum: number, workout: any) => {
                    if (workout.total_volume) {
                        return sum + parseFloat(String(workout.total_volume));
                    }
                    return sum;
                }, 0);
                setTotalVolume(volume);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUser();
            fetchStats();
        }, [fetchStats])
    );

    // Sync local form state when the global user object updates
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                height: user.height?.toString() || '',
                gender: (user.gender as 'male' | 'female') || 'male',
            }));
        }
    }, [user]);

    // Format total volume
    const formattedVolume = useMemo(() => {
        if (totalVolume >= 1000000) {
            return `${(totalVolume / 1000000).toFixed(1)}T`;
        } else if (totalVolume >= 1000) {
            return `${(totalVolume / 1000).toFixed(1)}K`;
        }
        return totalVolume.toFixed(0);
    }, [totalVolume]);

    // --- Handlers ---

    // Helper to open/close modals and clear sensitive data on close
    const toggleModal = (key: keyof typeof modals, visible: boolean) => {
        setModals(prev => ({ ...prev, [key]: visible }));
        // Security: Clear password fields when closing the modal
        if (!visible && key === 'password') {
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
        }
    };

    const handleLogout = () => {
        const performLogout = () => {
            clearTokens();
            clearUser();
            router.replace('/(auth)');
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to logout?")) performLogout();
        } else {
            Alert.alert("Log Out", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: performLogout }
            ]);
        }
    };

    // Centralized save handler for all modals
    const handleSave = async (type: 'height' | 'gender' | 'password') => {
        setIsSaving(true);
        try {
            let result;
            
            // Execute specific API call based on type
            if (type === 'height') {
                if (!formData.height) throw new Error("Please enter your height");
                result = await updateHeight(parseFloat(formData.height));
            } else if (type === 'gender') {
                result = await updateGender(formData.gender);
            } else if (type === 'password') {
                if (!formData.oldPassword || !formData.newPassword) throw new Error("Missing fields");
                if (formData.newPassword.length < 8) throw new Error("New password must be at least 8 characters");
                result = await changePassword(formData.oldPassword, formData.newPassword);
            }

            if (result?.error) throw new Error(result.error);
            
            // On success: refresh data and close modal
            await fetchUser();
            toggleModal(type, false);
            
        } catch (error: any) {
            Alert.alert("Action Failed", error.message || "Something went wrong.");
        } finally {
            setIsSaving(false);
        }
    };

    // ========================================================================
    // 3. RENDER
    // ========================================================================
    
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>SESSIONS</Text>
                        <View style={styles.statValueContainer}>
                            <Text style={styles.statValue}>{sessionsCount}</Text>
                            <Ionicons name="trophy" size={16} color={theme.colors.status.rest} style={styles.statIcon} />
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>TOTAL VOLUME</Text>
                        <Text style={styles.statValue}>{formattedVolume}</Text>
                    </View>
                </View>

                {/* Settings Cards */}
                <View style={styles.settingsContainer}>
                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => {
                            // TODO: Navigate to edit profile
                            Alert.alert("Edit Profile", "Profile editing coming soon!");
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>EDIT PROFILE</Text>
                            <Text style={styles.settingSubtitle}>BIO, WEIGHT, GOALS</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => router.push('/(permissions)')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pulse-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>HEALTH CONNECT</Text>
                            <Text style={styles.settingSubtitle}>SYNC BIOMETRICS</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => {
                            Alert.alert("Notifications", "Notification settings coming soon!");
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>NOTIFICATIONS</Text>
                            <Text style={styles.settingSubtitle}>SMART REMINDERS</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => {
                            Alert.alert("Data Management", "Data export coming soon!");
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="server-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>DATA MANAGEMENT</Text>
                            <Text style={styles.settingSubtitle}>EXPORT JSON/CSV</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => {
                            Alert.alert("Privacy & Security", "Privacy settings coming soon!");
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="shield-checkmark-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>PRIVACY & SECURITY</Text>
                            <Text style={styles.settingSubtitle}>AUTH CONTROLS</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingCard}
                        onPress={() => {
                            if (user?.is_pro) {
                                Alert.alert("Manage Subscription", "Subscription management coming soon!");
                            } else {
                                router.push('/(account)/upgrade');
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="card-outline" size={24} color="#FFFFFF" />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>SUBSCRIPTION</Text>
                            <Text style={[styles.settingSubtitle, styles.subscriptionSubtitle]}>
                                {user?.is_pro ? 'MANAGE FORCE PRO BILLING' : 'UPGRADE TO PRO'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>FORCE PERFORMANCE {new Date().getFullYear()}</Text>  

            </ScrollView>

            <Modal visible={modals.height} transparent animationType="fade" onRequestClose={() => toggleModal('height', false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Height</Text>
                            <Text style={styles.modalSubtitle}>This helps us calculate your calorie needs.</Text>
                        </View>
                        
                        <View style={styles.bigInputContainer}>
                            <TextInput
                                style={styles.bigInput}
                                value={formData.height}
                                onChangeText={(t) => setFormData({ ...formData, height: t })}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={theme.colors.text.zinc700}
                                autoFocus
                                selectionColor={theme.colors.status.active}
                            />
                            <Text style={styles.bigInputSuffix}>cm</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('height', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('height')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color={theme.colors.text.primary} /> : <Text style={styles.btnSaveText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={modals.gender} transparent animationType="fade" onRequestClose={() => toggleModal('gender', false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Gender</Text>
                        <Text style={styles.modalSubtitle}>For physiological calculations.</Text>
                        
                        <View style={styles.genderRow}>
                            <TouchableOpacity 
                                style={[styles.genderCard, formData.gender === 'male' && styles.genderCardActive]}
                                onPress={() => setFormData({ ...formData, gender: 'male' })}
                            >
                                <Ionicons 
                                    name="male" 
                                    size={32} 
                                    color={formData.gender === 'male' ? theme.colors.text.primary : theme.colors.text.secondary} 
                                />
                                <Text style={[styles.genderLabel, formData.gender === 'male' && styles.genderLabelActive]}>Male</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.genderCard, formData.gender === 'female' && styles.genderCardActive]}
                                onPress={() => setFormData({ ...formData, gender: 'female' })}
                            >
                                <Ionicons 
                                    name="female" 
                                    size={32} 
                                    color={formData.gender === 'female' ? theme.colors.text.primary : theme.colors.text.secondary} 
                                />
                                <Text style={[styles.genderLabel, formData.gender === 'female' && styles.genderLabelActive]}>Female</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('gender', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('gender')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color={theme.colors.text.primary} /> : <Text style={styles.btnSaveText}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={modals.password} transparent animationType="fade" onRequestClose={() => toggleModal('password', false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <Text style={styles.modalSubtitle}>Ensure your new password is secure.</Text>
                        
                        <View style={styles.inputStack}>
                            <TextInput
                                style={styles.cleanInput}
                                value={formData.oldPassword}
                                onChangeText={(t) => setFormData({ ...formData, oldPassword: t })}
                                placeholder="Current Password"
                                placeholderTextColor={theme.colors.text.zinc500}
                                secureTextEntry
                            />
                            <View style={styles.inputSeparator} />
                            <TextInput
                                style={styles.cleanInput}
                                value={formData.newPassword}
                                onChangeText={(t) => setFormData({ ...formData, newPassword: t })}
                                placeholder="New Password"
                                placeholderTextColor={theme.colors.text.zinc500}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('password', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('password')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color={theme.colors.text.primary} /> : <Text style={styles.btnSaveText}>Change</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ============================================================================
// 4. STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.m,
        paddingTop: theme.spacing.l,
    },
    
    // --- Stats Cards ---
    statsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    statLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
        marginBottom: theme.spacing.s,
    },
    statValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: '800',
        color: theme.colors.status.rest,
    },
    statIcon: {
        marginTop: 4,
    },
    
    // --- Settings Cards ---
    settingsContainer: {
        gap: theme.spacing.s,
    },
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        gap: theme.spacing.m,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: theme.typography.sizes.m,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    settingSubtitle: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.labelTight,
    },
    subscriptionSubtitle: {
        color: theme.colors.status.rest,
    },

    // --- Sections ---
    sectionContainer: {
        marginTop: theme.spacing.xl,
        marginHorizontal: theme.spacing.m,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '600',
        color: theme.colors.text.zinc600,
        textTransform: 'uppercase',
        marginLeft: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    sectionContent: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l, 
        overflow: 'hidden',
    },

    // --- Rows ---
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.ui.glass,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.ui.border,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.s,
    },
    rowLabel: {
        fontSize: theme.typography.sizes.m,
        color: theme.colors.text.primary,
        fontWeight: '400',
    },
    rowLabelDestructive: {
        color: theme.colors.status.error,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        fontSize: theme.typography.sizes.m,
        color: theme.colors.text.secondary,
        marginRight: 4,
    },

    versionText: {
        textAlign: 'center',
        color: theme.colors.text.zinc700,
        fontSize: theme.typography.sizes.xs,
        marginTop: theme.spacing.xxl,
        marginBottom: theme.spacing.l,
    },

    // --- PRO Subscription Styles ---
    proCard: {
        backgroundColor: `${theme.colors.status.rest}15`,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        borderWidth: 1,
        borderColor: `${theme.colors.status.rest}30`,
        marginBottom: theme.spacing.s,
    },
    proHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    proIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${theme.colors.status.rest}25`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    proTextContainer: {
        flex: 1,
    },
    proTitle: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '700',
        color: theme.colors.status.rest,
        marginBottom: 4,
    },
    proSubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
    },
    upgradeCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
        borderWidth: 2,
        borderColor: theme.colors.status.rest,
        borderStyle: 'dashed',
    },
    upgradeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    upgradeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${theme.colors.status.rest}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.m,
    },
    upgradeTextContainer: {
        flex: 1,
    },
    upgradeTitle: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    upgradeSubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
    },

    // --- Modern Modals ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: theme.spacing.m,
    },
    modalCard: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: theme.colors.background,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.s,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },

    // Height Specific
    bigInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: theme.spacing.xxl,
    },
    bigInput: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: '700',
        color: theme.colors.text.primary,
        minWidth: 60,
        textAlign: 'center',
    },
    bigInputSuffix: {
        fontSize: theme.typography.sizes.l,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.s,
    },

    // Gender Specific (Visual Cards)
    genderRow: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        marginBottom: theme.spacing.xxl,
        width: '100%',
    },
    genderCard: {
        flex: 1,
        backgroundColor: theme.colors.ui.border,
        borderRadius: theme.borderRadius.l,
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderCardActive: {
        backgroundColor: theme.colors.status.active,
        borderColor: theme.colors.status.active,
    },
    genderLabel: {
        marginTop: theme.spacing.s,
        fontSize: theme.typography.sizes.s,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    genderLabelActive: {
        color: theme.colors.text.primary,
    },

    // Password Specific (Stacked Inputs)
    inputStack: {
        width: '100%',
        backgroundColor: theme.colors.ui.border,
        borderRadius: theme.borderRadius.m,
        marginBottom: theme.spacing.xl,
    },
    cleanInput: {
        padding: theme.spacing.m,
        fontSize: theme.typography.sizes.m,
        color: theme.colors.text.primary,
        height: 54,
    },
    inputSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.ui.border,
        marginLeft: theme.spacing.m,
    },

    // Modal Action Buttons
    modalActions: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        width: '100%',
    },
    btnCancel: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancelText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
    btnSave: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.status.active,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSaveText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
});