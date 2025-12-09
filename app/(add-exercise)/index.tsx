import { getWorkout } from "@/api/Workout";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AddExerciseScreen() {
    const { workoutID } = useLocalSearchParams();
    const [workout, setWorkout] = useState<any>(null);

    useEffect(() => {
        console.log("workoutID from params:", workoutID);
        if (workoutID) {
            getWorkout(Number(workoutID)).then((workout: any) => {
                setWorkout(workout);
                console.log("Workout:", workout);
            });
        }
    }, [workoutID]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Add Exercise</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
