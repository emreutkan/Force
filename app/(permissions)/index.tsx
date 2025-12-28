import { healthService } from '@/api/Health';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
    const insets = useSafeAreaInsets();
    const [hasHealthPermission, setHasHealthPermission] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        checkHealthPermission();
    }, []);

    const checkHealthPermission = async () => {
        setIsChecking(true);
        try {
            const hasPermission = await healthService.checkPermissionStatus();
            setHasHealthPermission(hasPermission);
        } catch (error) {
            console.log('Error checking health permission:', error);
            setHasHealthPermission(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleRequestHealthPermission = async () => {
        setIsRequesting(true);
        try {
            const success = await healthService.initialize();
            if (success) {
                setHasHealthPermission(true);
                Alert.alert(
                    'Success',
                    `Health permissions granted successfully. You can now see your step count on the home screen.`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Permission Denied',
                    Platform.OS === 'ios'
                        ? 'HealthKit permissions were denied. Please enable them in Settings > Privacy & Security > Health.'
                        : 'Google Fit permissions were denied. Please enable them in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Check Again', onPress: checkHealthPermission },
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to request health permissions');
        } finally {
            setIsRequesting(false);
        }
    };

    const getHealthInstructions = () => {
        if (Platform.OS === 'ios') {
            return [
                '1. Tap "Request Health Permissions" below',
                '2. Allow access to step count when prompted',
                '3. If denied, go to Settings > Privacy & Security > Health > uTrack',
                '4. Enable "Read Steps" permission',
            ];
        } else {
            return [
                '1. Tap "Request Health Permissions" below',
                '2. Sign in to your Google account if prompted',
                '3. Grant access to Google Fit activity data',
                '4. If denied, go to Settings > Apps > Google Fit > Permissions',
                '5. Enable "Physical Activity" permission',
            ];
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <UnifiedHeader 
                title="Permissions"
                onBackPress={() => router.back()}
                backButtonText="Account"
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, paddingTop: 84 }}>
                <View style={styles.section}>
                    <View style={styles.permissionCard}>
                        <View style={styles.permissionHeader}>
                            <Ionicons 
                                name={Platform.OS === 'ios' ? 'heart-outline' : 'fitness-outline'} 
                                size={24} 
                                color="#0A84FF" 
                            />
                            <Text style={styles.permissionTitle}>Health Permissions</Text>
                        </View>

                        {isChecking ? (
                            <View style={styles.checkingContainer}>
                                <ActivityIndicator size="small" color="#0A84FF" />
                                <Text style={styles.checkingText}>Checking permissions...</Text>
                            </View>
                        ) : hasHealthPermission ? (
                            <View style={styles.grantedContainer}>
                                <View style={styles.grantedBadge}>
                                    <Ionicons name="checkmark-circle" size={24} color="#32D74B" />
                                    <Text style={styles.grantedText}>Permissions Granted</Text>
                                </View>
                                <Text style={styles.grantedDescription}>
                                    You can see your daily step count on the home screen.
                                </Text>
                                <TouchableOpacity
                                    style={styles.refreshButton}
                                    onPress={checkHealthPermission}
                                >
                                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.requestContainer}>
                                <Text style={styles.requestDescription}>
                                    Grant access to your health data to view your daily step count.
                                </Text>
                                
                                <View style={styles.instructionsContainer}>
                                    <Text style={styles.instructionsTitle}>How to enable:</Text>
                                    {getHealthInstructions().map((instruction, index) => (
                                        <Text key={index} style={styles.instructionText}>
                                            {instruction}
                                        </Text>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.requestButton, isRequesting && styles.requestButtonDisabled]}
                                    onPress={handleRequestHealthPermission}
                                    disabled={isRequesting}
                                >
                                    {isRequesting ? (
                                        <>
                                            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.requestButtonText}>Requesting...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                            <Text style={styles.requestButtonText}>Request Health Permissions</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
    },
    section: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    permissionCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    permissionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    checkingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    checkingText: {
        color: '#8E8E93',
        fontSize: 15,
        marginTop: 12,
    },
    grantedContainer: {
        alignItems: 'center',
    },
    grantedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    grantedText: {
        color: '#32D74B',
        fontSize: 17,
        fontWeight: '600',
    },
    grantedDescription: {
        color: '#8E8E93',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20,
    },
    refreshButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#2C2C2E',
    },
    refreshButtonText: {
        color: '#0A84FF',
        fontSize: 15,
        fontWeight: '600',
    },
    requestContainer: {
        alignItems: 'stretch',
    },
    requestDescription: {
        color: '#FFFFFF',
        fontSize: 15,
        marginBottom: 20,
        lineHeight: 22,
    },
    instructionsContainer: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    instructionsTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    instructionText: {
        color: '#8E8E93',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    requestButtonDisabled: {
        opacity: 0.6,
    },
    requestButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});

