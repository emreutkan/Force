
import { clearTokens } from '@/api/Storage';
import { changePassword, updateGender, updateHeight } from '@/api/account';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useUserStore } from '@/state/userStore'; // Use the store!
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser, clearUser } = useUserStore();
    const [isEditingHeight, setIsEditingHeight] = useState(false);
    const [isEditingGender, setIsEditingGender] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [tempHeight, setTempHeight] = useState('');
    const [tempGender, setTempGender] = useState<'male' | 'female'>('male');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch user on mount (just in case it wasn't fetched during login yet)
    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            if (user.height) setTempHeight(user.height.toString());
            if (user.gender) setTempGender(user.gender as 'male' | 'female');
        }
    }, [user]);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to logout?")) {
                clearTokens();
                clearUser();
                router.replace('/(auth)');
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Logout", 
                        style: "destructive", 
                        onPress: () => {
                            clearTokens();
                            clearUser(); // Clear global state
                            router.replace('/(auth)');
                        }
                    }
                ]
            );
        }
    };

    const handleSaveHeight = async () => {
        if (!tempHeight) {
            Alert.alert("Missing Field", "Please enter your height.");
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateHeight(parseFloat(tempHeight));
            if (result?.height || result?.message) {
                await fetchUser();
                setIsEditingHeight(false);
                Alert.alert("Success", "Height updated successfully");
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to update height");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveGender = async () => {
        setIsSaving(true);
        try {
            const result = await updateGender(tempGender);
            if (result?.gender || result?.message) {
                await fetchUser();
                setIsEditingGender(false);
                Alert.alert("Success", "Gender updated successfully");
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to update gender");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            Alert.alert("Missing Fields", "Please enter both old and new password.");
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert("Invalid Password", "New password must be at least 8 characters long.");
            return;
        }

        setIsSaving(true);
        try {
            const result = await changePassword(oldPassword, newPassword);
            if (result?.message) {
                setIsChangingPassword(false);
                setOldPassword('');
                setNewPassword('');
                Alert.alert("Success", result.message);
            } else if (result?.error) {
                Alert.alert("Error", result.error);
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to change password");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* iOS-style Navigation Bar */}
            <UnifiedHeader 
                title="Account"
                onBackPress={() => router.push('/(home)')}
                backButtonText="Home"
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, paddingTop: 84 }}>
                {/* Profile Card */}
                <View style={styles.section}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                            </Text>
                            <Text style={styles.profileEmail}>{user?.email || 'Loading...'}</Text>
                        </View>
                    </View>
                </View>

                {/* Account Settings */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setIsEditingHeight(true)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuLabel}>Height</Text>
                            <Text style={styles.menuValue}>
                                {user?.height ? `${user.height} cm` : 'Not set'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, { marginTop: 12 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setIsEditingGender(true)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuLabel}>Gender</Text>
                            <Text style={styles.menuValue}>
                                {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {/* Password Change */}
                <View style={[styles.section, { marginTop: 12 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => setIsChangingPassword(true)}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="lock-closed-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
                            <Text style={styles.menuLabel}>Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {/* Permissions */}
                <View style={[styles.section, { marginTop: 12 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => router.push('/(permissions)')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
                            <Text style={styles.menuLabel}>Permissions</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {/* Knowledge Base */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => router.push('/(knowledge-base)')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="library-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
                            <Text style={styles.menuLabel}>Knowledge Base</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {/* Volume Analysis */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => router.push('/(volume-analysis)')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="bar-chart-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
                            <Text style={styles.menuLabel}>Volume Analysis</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {/* Logout Group */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, justifyContent: 'center' }]} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Height Edit Modal */}
            <Modal
                visible={isEditingHeight}
                animationType="fade"
                transparent
                onRequestClose={() => setIsEditingHeight(false)}
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
                                onPress={() => setIsEditingHeight(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveHeight}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Gender Edit Modal */}
            <Modal
                visible={isEditingGender}
                animationType="fade"
                transparent
                onRequestClose={() => setIsEditingGender(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Gender</Text>
                        <View style={styles.genderOptions}>
                            <TouchableOpacity
                                style={[styles.genderOption, tempGender === 'male' && styles.genderOptionSelected]}
                                onPress={() => setTempGender('male')}
                            >
                                <Text style={[styles.genderOptionText, tempGender === 'male' && styles.genderOptionTextSelected]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderOption, tempGender === 'female' && styles.genderOptionSelected]}
                                onPress={() => setTempGender('female')}
                            >
                                <Text style={[styles.genderOptionText, tempGender === 'female' && styles.genderOptionTextSelected]}>Female</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsEditingGender(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveGender}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Password Change Modal */}
            <Modal
                visible={isChangingPassword}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setIsChangingPassword(false);
                    setOldPassword('');
                    setNewPassword('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            placeholder="Old Password"
                            placeholderTextColor="#8E8E93"
                            secureTextEntry
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New Password (min 8 characters)"
                            placeholderTextColor="#8E8E93"
                            secureTextEntry
                            autoCapitalize="none"
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => {
                                    setIsChangingPassword(false);
                                    setOldPassword('');
                                    setNewPassword('');
                                }}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleChangePassword}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalButtonSaveText}>Change</Text>
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
        backgroundColor: '#000000', // Black Background
    },
    content: {
        flex: 1,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2C2C2E', 
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '400',
        color: '#8E8E93',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700', 
        color: '#FFFFFF',
        marginBottom: 8,
    },
    profileEmail: {
        fontSize: 17,
        color: '#8E8E93',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '300',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginLeft: 32, 
        marginTop: 24,
        marginBottom: 16,
    },
    section: {
        backgroundColor: '#1C1C1E', 
        borderRadius: 22,
        marginHorizontal: 16,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    menuItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '400',
    },
    menuValue: {
        fontSize: 17,
        color: '#8E8E93',
        fontWeight: '400',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43',
        marginLeft: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '400',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '400',
        textAlign: 'center',
        width: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 22,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 22,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '400',
        marginBottom: 24,
        textAlign: 'center',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
    },
    genderOptionSelected: {
        borderColor: '#0A84FF',
        backgroundColor: 'rgba(10, 132, 255, 0.1)',
    },
    genderOptionText: {
        color: '#8E8E93',
        fontSize: 17,
        fontWeight: '400',
    },
    genderOptionTextSelected: {
        color: '#0A84FF',
        fontWeight: '400',
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 22,
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
        fontWeight: '400',
        color: '#FFFFFF',
    },
    modalButtonSaveText: {
        fontSize: 17,
        fontWeight: '400',
        color: '#FFFFFF',
    },
});
