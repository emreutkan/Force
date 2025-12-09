import { getActiveWorkout } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveWorkoutScreen() {
    const insets = useSafeAreaInsets();
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

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

    if (!activeWorkout) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, marginBottom: insets.bottom - 20 }]}>
            <View style={styles.WorkoutHeader}>
            <Text style={styles.WorkoutTitle}>{activeWorkout.title}</Text>
            <Text style={styles.WorkoutDuration}>{elapsedTime}</Text>
            </View>
            <Text style={styles.text}>{activeWorkout.notes}</Text>
            
            <TouchableOpacity onPress={() => router.push({
                pathname: '/(add-exercise)',
                params: {
                    workoutID: activeWorkout.id
                }
            })} 
            style={{...styles.addExerciseButtonContainer, bottom: insets.bottom + 20}} >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    text: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    WorkoutHeader: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'gray',
        margin: 1,
        borderRadius: 26,
    },
    WorkoutTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    WorkoutDuration: {
        color: 'orange',
        fontSize: 20,
        fontWeight: 'bold',
    },
    addExerciseButtonContainer: {
        position: 'absolute',
        left: 0,
        
        right: 0,
        backgroundColor: 'orange',
        padding: 10,
        marginHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

});

