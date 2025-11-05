import { clearTokens } from '@/api/Storage';
import { createWorkout } from '@/api/Workout';
import { useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Home() {
    // 1. State lives here, at the top level
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
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

    return (
        <View style={styles.container}>
            <Text>Home</Text>
            
            {/* 2. Just toggle the boolean state */}
            <Button title="Create Workout" onPress={() => setModalVisible(true)} />
            <Button title="Logout" onPress={() => clearTokens()} />

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
                    <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
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
    }
});