import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface ExerciseListHeaderProps {
  paddingTop: number;
}

export default function ExerciseListHeader({ paddingTop }: ExerciseListHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: paddingTop + 10 }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
      </Pressable>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>EXERCISE STATS</Text>
        <Text style={styles.headerSubtitle}>SELECT AN EXERCISE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingBottom: 15,
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
});
