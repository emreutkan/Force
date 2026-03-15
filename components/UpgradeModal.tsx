import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
  upgradeUrl?: string;
}

const PRO_FEATURES = [
  { icon: 'pulse', text: 'CNS recovery guidance', color: theme.colors.status.rest },
  { icon: 'trophy', text: 'Full 1RM history', color: theme.colors.status.warning },
  { icon: 'bar-chart', text: '12-week volume analysis', color: theme.colors.status.success },
  { icon: 'fitness', text: 'Recovery and rest tips', color: theme.colors.status.active },
  { icon: 'analytics', text: 'Advanced workout insights', color: theme.colors.status.active },
  { icon: 'book', text: 'Training research library', color: theme.colors.status.warning },
];

export default function UpgradeModal({
  visible,
  onClose,
  feature = 'Pro feature',
  message = 'This feature is included with Pro.',
  upgradeUrl = '/(account)/upgrade',
}: UpgradeModalProps) {
  const handleUpgrade = () => {
    onClose();
    router.push(upgradeUrl as any);
  };

  return (
    <Modal
      presentationStyle="formSheet"
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(192, 132, 252, 0.3)', 'rgba(168, 85, 247, 0.1)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Ionicons name="star" size={28} color={theme.colors.status.rest} />
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.featureName}>{feature}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <Text style={styles.listLabel}>Included with Pro</Text>
          <View style={styles.featuresList}>
            {PRO_FEATURES.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: `${item.color}1A` }]}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                </View>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
              <LinearGradient
                colors={['#a855f7', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.upgradeButtonText}>See Pro plans</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Keep using free plan</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 2, 5, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  modal: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.2)',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
  },
  proBadge: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.m,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: theme.colors.status.rest,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  featureName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.status.rest,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  listLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.s,
  },
  featuresList: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.l,
    gap: theme.spacing.s,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  actions: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.s,
  },
  upgradeButton: {
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.xl,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
