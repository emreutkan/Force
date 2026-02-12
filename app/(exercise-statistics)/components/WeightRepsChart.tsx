import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import NeuralBarChart from './NeuralBarChart';

interface WeightRepsChartProps {
  kgRepsData: any[];
}

export default function WeightRepsChart({ kgRepsData }: WeightRepsChartProps) {
  if (kgRepsData.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name="barbell" size={18} color={theme.colors.text.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>WEIGHT & REPS</Text>
          <Text style={styles.sectionSubtitle}>HIGHEST WEIGHT AT EACH REP COUNT</Text>
        </View>
      </View>

      <NeuralBarChart data={kgRepsData} valueKey="weight" mode="reps" />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
