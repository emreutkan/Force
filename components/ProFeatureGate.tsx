import { useUser } from '@/hooks/useUser';
import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, typographyStyles } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ProFeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  description?: string;
}

export default function ProFeatureGate({
  children,
  featureName,
  description,
}: ProFeatureGateProps) {
  const { data: user } = useUser({ enabled: true });
  const isPro = user?.is_pro ?? false;
  const helperText =
    description ||
    `${featureName} is included with Pro. Open the plan screen to see what it adds.`;

  if (!isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.blurContainer}>
          <View style={{ opacity: 0.3 }}>{children}</View>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.overlay}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']}
            style={styles.gradient}
          />

          <View style={styles.content}>
            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color={theme.colors.status.rest} />
              <Text style={styles.proBadgeText}>Available on Pro</Text>
            </View>

            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={32} color={theme.colors.status.rest} />
            </View>

            <Text style={styles.featureName}>{featureName}</Text>
            <Text style={styles.description}>{helperText}</Text>

            <Pressable
              style={styles.upgradeButton}
              onPress={() => router.push('/(account)/upgrade')}
            >
              <LinearGradient
                colors={['#a855f7', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.upgradeButtonText}>See Pro plans</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            <Text style={styles.benefitsText}>
              Keep using the free plan, or upgrade later if you want this and the rest of Pro.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
  },
  blurContainer: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    zIndex: 1,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.m,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: theme.colors.status.rest,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  featureName: {
    ...typographyStyles.h4,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    color: theme.colors.text.primary,
  },
  description: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: theme.spacing.s,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  benefitsText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
