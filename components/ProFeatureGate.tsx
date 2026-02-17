import { useSettingsStore } from '@/state/userStore';
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

/**
 * Wrapper component that locks content behind Pro subscription
 * Shows upgrade prompt if user is not Pro, otherwise renders children
 *
 * @example
 * <ProFeatureGate featureName="CNS Recovery Tracking" description="Track your nervous system recovery">
 *   <CNSCard />
 * </ProFeatureGate>
 */
export default function ProFeatureGate({ children, featureName, description }: ProFeatureGateProps) {
  const isPro = useSettingsStore((state) => state.isPro);

  if (!isPro) {
    return (
      <View style={styles.container}>
        {/* Blurred preview of the feature */}
        <View style={styles.blurContainer}>
          <View style={{ opacity: 0.3 }}>
            {children}
          </View>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </View>

        {/* Lock overlay */}
        <View style={styles.overlay}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']}
            style={styles.gradient}
          />

          <View style={styles.content}>
            {/* Pro badge */}
            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color={theme.colors.status.rest} />
              <Text style={styles.proBadgeText}>PRO FEATURE</Text>
            </View>

            {/* Lock icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={32} color={theme.colors.status.rest} />
            </View>

            {/* Feature name */}
            <Text style={styles.featureName}>{featureName}</Text>

            {/* Description */}
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}

            {/* Upgrade button */}
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
                <Text style={styles.upgradeButtonText}>UPGRADE TO PRO</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            {/* Benefits text */}
            <Text style={styles.benefitsText}>
              Unlock this + all premium features
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
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
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
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  benefitsText: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
