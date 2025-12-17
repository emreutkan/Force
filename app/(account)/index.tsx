
import { clearTokens } from '@/api/Storage';
import { useUserStore } from '@/state/userStore'; // Use the store!
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser, clearUser } = useUserStore();

    // Fetch user on mount (just in case it wasn't fetched during login yet)
    useEffect(() => {
        fetchUser();
    }, []);

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


    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* iOS-style Navigation Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#007AFF" />
                    <Text style={styles.backText}>Home</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account</Text>
                <View style={{ width: 60 }} /> 
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}>
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


                {/* Logout Group */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, justifyContent: 'center' }]} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Black Background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        height: 44, 
        backgroundColor: '#000000', 
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80,
    },
    backText: {
        color: '#0A84FF', // iOS Dark Mode Blue
        fontSize: 17,
        marginLeft: -4, 
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
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
        width: 60,
        height: 60,
        borderRadius: 30,
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
        fontWeight: '600',
        color: '#8E8E93',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600', 
        color: '#FFFFFF',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 15,
        color: '#8E8E93',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        marginLeft: 32, 
        marginTop: 24, // Added spacing
        marginBottom: 8,
    },
    section: {
        backgroundColor: '#1C1C1E', 
        borderRadius: 12, // Smoother corners
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#3C3C43', // Dark Separator
        minHeight: 44,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 17,
        color: '#FFFFFF',
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
    },
});
