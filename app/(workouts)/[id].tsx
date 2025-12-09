import { getWorkout } from '@/api/Workout';
import { Workout } from '@/api/types';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (id) {
            getWorkout(Number(id)).then((data) => {
                setWorkout(data);
            });
        }
    }, [id]);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '00:00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
                 <WorkoutDetailView 
                    workout={workout} 
                    elapsedTime={formatDuration(workout?.duration || 0)} 
                    isActive={false} 
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#000000',
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#0A84FF',
        fontSize: 17,
        marginLeft: -4,
    },
    content: {
        flex: 1,
        // WorkoutDetailView handles its own padding/scrolling, 
        // but since we wrapped it in a container with a header, 
        // we might want to ensure it takes available space.
    }
});
