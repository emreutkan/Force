import { Stack } from 'expo-router';

export default function WorkoutProgramLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020205' },
        animation: 'slide_from_right',
      }}
    />
  );
}
