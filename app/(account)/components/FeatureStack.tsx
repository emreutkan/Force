import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface Feature {
  icon: string;
  iconColor: string;
  title: string;
  benefit: string;
}

const FEATURES: Feature[] = [
  {
    icon: 'pulse',
    iconColor: theme.colors.status.rest,
    title: 'CNS RECOVERY',
    benefit: 'See whether your nervous system is recovered before you push a hard session.',
  },
  {
    icon: 'trophy',
    iconColor: theme.colors.status.warning,
    title: 'FULL 1RM HISTORY',
    benefit:
      'Review your full strength history for every exercise instead of only the last 30 days.',
  },
  {
    icon: 'fitness',
    iconColor: theme.colors.status.active,
    title: 'RECOVERY TIPS',
    benefit:
      'Get practical post-workout guidance for muscle recovery, protein timing, and session spacing.',
  },
  {
    icon: 'bar-chart',
    iconColor: theme.colors.status.success,
    title: '12-WEEK VOLUME ANALYSIS',
    benefit: 'Compare training load across longer blocks, with up to 12 weeks instead of 4.',
  },
  {
    icon: 'analytics',
    iconColor: theme.colors.status.active,
    title: 'ADVANCED WORKOUT INSIGHTS',
    benefit:
      'See whether each workout moved performance forward, held steady, or needs adjustment.',
  },
  {
    icon: 'time',
    iconColor: theme.colors.status.rest,
    title: 'REST AND FREQUENCY TIPS',
    benefit:
      'Get clearer rest timing and weekly frequency suggestions for each exercise category.',
  },
  {
    icon: 'book',
    iconColor: theme.colors.status.warning,
    title: 'TRAINING RESEARCH LIBRARY',
    benefit: 'Browse research by muscle group, exercise type, and training goal in one place.',
  },
];

export default function FeatureStack() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WHAT PRO ADDS</Text>
      {FEATURES.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[`${feature.iconColor}33`, `${feature.iconColor}1A`]}
              style={styles.iconGradient}
            />
            <Ionicons name={feature.icon as any} size={20} color={feature.iconColor} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{feature.title}</Text>
            <Text style={styles.benefit}>{feature.benefit}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.m,
    marginLeft: 4,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.primary,
  },
  benefit: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
