import { clearTokens } from '@/api/Storage';
import { createWorkout, getActiveWorkout } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function Home() {
    // 1. State lives here, at the top level
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [activeWorkout, setActiveWorkout] = useState<any>(null);

    useEffect(() => {
        getActiveWorkout().then((workout) => {
            setActiveWorkout(workout);
            console.log("Active Workout:", workout);
        });
    }, []);

    const handleCreateWorkout = async () => {
        try {
            const result = await createWorkout({ title: workoutTitle });

            if (typeof result === 'object' && 'error' in result && result.error === "ACTIVE_WORKOUT_EXISTS") {
                Alert.alert(
                    "Active Workout Exists",
                    `You already have an active workout (ID: ${result.active_workout}).`,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => setModalVisible(false)
                        },
                        {
                            text: "View/Resume",
                            onPress: () => {
                                setModalVisible(false);
                                // TODO: Navigate to the workout screen with this ID
                                console.log("Navigate to workout", result.active_workout);
                            }
                        }
                    ]
                );
                return;            }
            else if (typeof result === 'object' && 'id' in result && !('error' in result)) {
                console.log('Workout created:', result.id);
                setModalVisible(false);
                setWorkoutTitle('');
                return;
            }
            else {
                Alert.alert(
                    "Error",
                    `An unknown error occurred while creating the workout: ${result}`,
                    [
                        { text: "OK", style: "cancel", onPress: () => setModalVisible(false) }
                    ]
                );
            }
        } catch (e) {
            console.error(e);
        } finally {
            setModalVisible(false); // Close modal
            setWorkoutTitle('');    // Reset input
        }
    }

    const logout = () => {
        clearTokens();
        router.replace('/(auth)');
    };

    const renderActiveWorkout = () => {
        if (!activeWorkout) return null;

        return (
            <TouchableOpacity 
                style={styles.activeCard} 
                onPress={() => router.push(`/workout/${activeWorkout.id}`)}
                activeOpacity={0.8}
            >
                {/* Header: Label + Live Indicator */}
                <View style={styles.cardHeader}>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>IN PROGRESS</Text>
                    </View>
                    {/* Professional Icon instead of text ">" */}
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>

                {/* Content: Title */}
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {activeWorkout.title}
                </Text>
                
            </TouchableOpacity>
        );
    }

    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { padding: 20, paddingTop: insets.top }]}>
            {renderActiveWorkout()}
            <Text>Home</Text>
            
            {/* 2. Just toggle the boolean state */}
            <Button title="Create Workout" onPress={() => setModalVisible(true)} />
                <Button title="Logout" color="red" onPress={logout} />

            {/* 3. Render Modal conditionally based on state */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <TextInput 
                        placeholder="Workout Name" 
                        value={workoutTitle} 
                        onChangeText={setWorkoutTitle} 
                        style={styles.input}
                    />
                    <Button title="Create" onPress={handleCreateWorkout} />
                    <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        width: '100%'
    },
    activeCard: {
        width: '100%',
        backgroundColor: '#1C1C1E', // iOS System Gray 6 (Dark)
        borderRadius: 16,
        padding: 16,
        marginBottom: 24, // Push content down
        borderWidth: 1,
        borderColor: '#2C2C2E', // Subtle border for definition
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 215, 75, 0.1)', // Subtle Green Tint
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#32D74B', // iOS Green
        marginRight: 6,
    },
    liveText: {
        color: '#32D74B',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    cardSubtitle: {
        color: '#8E8E93', // iOS Gray
        fontSize: 14,
        fontWeight: '500',
    },
});

