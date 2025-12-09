import { getActiveWorkout } from '@/api/Workout';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ActiveWorkoutScreen() {
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        getActiveWorkout().then((workout) => {
            setActiveWorkout(workout);
            console.log("Active Workout:", workout);
        });
    }, []);

    useEffect(() => {
        let interval: any;
        
        // Explicitly check if activeWorkout exists and has created_at
        if (activeWorkout && activeWorkout.created_at) {
            const startTime = new Date(activeWorkout.created_at).getTime();
            
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = Math.max(0, now - startTime);
                
                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)));
                
                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setElapsedTime(formattedTime);
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeWorkout]);


    const renderAddExerciseModal = () => {
        return (
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.closeButton}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        <Text style={styles.text}>Select an exercise to add to the workout.</Text>
                    </ScrollView>
                </View>
            </Modal>
        );
    }

    return (
        <>
            <WorkoutDetailView 
                workout={activeWorkout} 
                elapsedTime={elapsedTime} 
                isActive={true} 
                onAddExercise={() => setIsModalVisible(true)} 
            />
            {renderAddExerciseModal()}
        </>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000', // Black background
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1C1C1E', // Keep header slightly lighter for contrast or make black? User said "all will also have black backgrounds". I'll keep header slightly distinct or make it black with border. Let's make it black with border to match detail view.
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
        fontWeight: 'bold',
    },
    modalContent: {
        padding: 16,
        backgroundColor: '#000000',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
    }
});
