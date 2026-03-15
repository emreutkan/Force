import { getErrorMessage } from '@/api/errorHandler';
import { theme, typographyStyles } from '@/constants/theme';
import { useOfferings, usePurchasePackage, useRestorePurchases } from '@/hooks/useRevenueCat';
import { logger } from '@/lib/logger';
import { isStoreNotConfiguredError, ENTITLEMENT_ID } from '@/services/revenueCat';
import { useSettingsStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ComparisonTable from './components/ComparisonTable';
import FeatureStack from './components/FeatureStack';
import PackageSelector from './components/PackageSelector';
import PricingDisplay from './components/PricingDisplay';
import UnlockButton from './components/UnlockButton';

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const setIsPro = useSettingsStore((state) => state.setIsPro);

  const {
    data: offering,
    isLoading: isLoadingOfferings,
    error: offeringsError,
    refetch: refetchOfferings,
  } = useOfferings();
  const purchaseMutation = usePurchasePackage();
  const restoreMutation = useRestorePurchases();

  useEffect(() => {
    if (offering?.availablePackages && !selectedPackage) {
      logger.info(
        'Available packages loaded',
        offering.availablePackages.map((pkg) => ({
          identifier: pkg.identifier,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
        }))
      );

      const monthlyPkg = offering.availablePackages.find((pkg) => pkg.identifier === 'monthly');
      const yearlyPkg = offering.availablePackages.find((pkg) => pkg.identifier === 'yearly');
      const weeklyPkg = offering.availablePackages.find((pkg) => pkg.identifier === 'weekly');

      setSelectedPackage(yearlyPkg || monthlyPkg || weeklyPkg || offering.availablePackages[0]);
    }
  }, [offering, selectedPackage]);

  const handleUpgrade = async () => {
    if (!selectedPackage) {
      Alert.alert('No plans available', 'Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      const customerInfo = await purchaseMutation.mutateAsync(selectedPackage);

      if (customerInfo) {
        const activeKeys = Object.keys(customerInfo.entitlements.active);
        logger.info('[PURCHASE] Active entitlement keys', { activeKeys });
        logger.info('[PURCHASE] Looking for entitlement ID', { entitlementId: ENTITLEMENT_ID });
        logger.info('[PURCHASE] Entitlement match result', {
          entitlementId: ENTITLEMENT_ID,
          matched: !!customerInfo.entitlements.active[ENTITLEMENT_ID],
        });

        const isPro = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        setIsPro(isPro);

        Alert.alert('Pro is active', 'You now have access to the full Pro plan.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        logger.info('Purchase cancelled by user');
      }
    } catch (error: any) {
      logger.error('Purchase error', error);
      const message = isStoreNotConfiguredError(error)
        ? "Purchases aren't available in this build. Set up App Store Connect and Google Play Console for real purchases; see REVENUECAT_QUICKSTART.md."
        : getErrorMessage(error as Error);
      Alert.alert('Purchase failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await restoreMutation.mutateAsync();

      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        setIsPro(true);
        Alert.alert('Purchases restored', 'Your Pro access is available again.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No purchases found', "We couldn't find a previous Pro purchase to restore.");
      }
    } catch (error: any) {
      logger.error('Restore error', error);
      const message = isStoreNotConfiguredError(error)
        ? "Restore isn't available in this build. Set up App Store Connect and Google Play Console first."
        : getErrorMessage(error as Error);
      Alert.alert('Restore failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPricingSection = () => {
    if (isLoadingOfferings) {
      return (
        <View style={styles.pricingPlaceholder}>
          <ActivityIndicator size="small" color={theme.colors.status.active} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      );
    }

    if (offeringsError || !offering) {
      return (
        <View style={styles.pricingPlaceholder}>
          <Ionicons name="alert-circle-outline" size={28} color={theme.colors.status.error} />
          <Text style={styles.pricingErrorText}>Couldn't load plans right now.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchOfferings()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <View style={styles.pricingHeader}>
          <Text style={styles.pricingLabel}>Choose a plan</Text>
          <Text style={styles.pricingText}>
            Logging stays free. Upgrade only if you want deeper recovery guidance and analysis.
          </Text>
        </View>

        {offering.availablePackages.length > 1 && selectedPackage && (
          <PackageSelector
            packages={offering.availablePackages}
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />
        )}

        <PricingDisplay packageInfo={selectedPackage} />
        <UnlockButton onPress={handleUpgrade} isLoading={isLoading} />

        <Pressable
          onPress={handleRestorePurchases}
          disabled={isLoading}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.restoreButton}
        >
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.disclosureText}>
          Payment is charged to your Apple ID at confirmation. Subscriptions renew automatically
          unless cancelled at least 24 hours before the current period ends. Manage your
          subscription in Apple ID Account Settings.
        </Text>

        <View style={styles.legalRow}>
          <Pressable
            onPress={() => Linking.openURL('https://emreutkan.github.io/forcelegal/privacy')}
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalSeparator}>·</Text>
          <Pressable
            onPress={() => Linking.openURL('https://emreutkan.github.io/forcelegal/terms')}
          >
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={32} color={theme.colors.text.zinc600} />
            </Pressable>
            <View style={styles.titleTextContainer}>
              <Text style={styles.heroTitle}>Pro</Text>
              <Text style={styles.authorityText}>
                Recovery guidance, research, and deeper training feedback
              </Text>
            </View>
          </View>

          <Text style={styles.heroSupport}>
            Keep using the free plan for logging. Upgrade when you want more context around
            recovery, progression, and workload.
          </Text>
        </View>

        <FeatureStack />
        <ComparisonTable />
        {renderPricingSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingTop: 0,
  },
  heroSection: {
    marginBottom: theme.spacing.xl,
    marginTop: 0,
    gap: theme.spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.m,
  },
  titleTextContainer: {
    flex: 1,
  },
  heroTitle: {
    ...typographyStyles.h1,
    fontSize: 52,
    lineHeight: 56,
    textAlign: 'left',
    marginBottom: 4,
    letterSpacing: -2.5,
  },
  authorityText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'left',
    lineHeight: 24,
    maxWidth: 280,
  },
  heroSupport: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    paddingLeft: 52,
  },
  pricingHeader: {
    marginBottom: theme.spacing.l,
    gap: theme.spacing.xs,
  },
  pricingLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.6,
    color: theme.colors.text.tertiary,
    marginLeft: 4,
  },
  pricingText: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  pricingPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.m,
    paddingVertical: theme.spacing.xxl,
    marginHorizontal: theme.spacing.m,
  },
  loadingText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  pricingErrorText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  retryButton: {
    backgroundColor: theme.colors.status.active,
    borderRadius: theme.borderRadius.xxl,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.m,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  restoreButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  disclosureText: {
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.s,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
