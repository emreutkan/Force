import { getErrorMessage } from '@/api/errorHandler';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOfferings, usePurchasePackage, useRestorePurchases } from '@/hooks/useRevenueCat';
import { isStoreNotConfiguredError, ENTITLEMENT_ID } from '@/services/revenueCat';
import { useSettingsStore } from '@/state/userStore';
import PremiumPreview from './components/PremiumPreview';
import BenefitsRow from './components/BenefitsRow';
import FeatureStack from './components/FeatureStack';
import PricingDisplay from './components/PricingDisplay';
import UnlockButton from './components/UnlockButton';
import PackageSelector from './components/PackageSelector';
import type { PurchasesPackage } from 'react-native-purchases';

export default function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const setIsPro = useSettingsStore((state) => state.setIsPro);

  // Fetch offerings from RevenueCat
  const {
    data: offering,
    isLoading: isLoadingOfferings,
    error: offeringsError,
    refetch: refetchOfferings,
  } = useOfferings();
  const purchaseMutation = usePurchasePackage();
  const restoreMutation = useRestorePurchases();

  // Set default selected package when offerings load
  useEffect(() => {
    if (offering?.availablePackages && !selectedPackage) {
      // Debug: Log all packages
      console.log('Available packages:', offering.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        price: pkg.product.price,
        priceString: pkg.product.priceString,
      })));

      // Default to monthly if available, otherwise first package
      const monthlyPkg = offering.availablePackages.find(
        (pkg) => pkg.identifier === 'monthly'
      );
      const yearlyPkg = offering.availablePackages.find(
        (pkg) => pkg.identifier === 'yearly'
      );
      const weeklyPkg = offering.availablePackages.find(
        (pkg) => pkg.identifier === 'weekly'
      );

      // Priority: yearly > monthly > weekly
      setSelectedPackage(yearlyPkg || monthlyPkg || weeklyPkg || offering.availablePackages[0]);
    }
  }, [offering, selectedPackage]);

  const handleUpgrade = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'No subscription packages available. Please try again later.');
      return;
    }

    setIsLoading(true);
    try {
      const customerInfo = await purchaseMutation.mutateAsync(selectedPackage);

      if (customerInfo) {
        // Immediately unlock — don't wait for the listener
        setIsPro(!!customerInfo.entitlements.active[ENTITLEMENT_ID]);
        Alert.alert('WELCOME TO PRO!', 'You now have access to all premium features.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // User cancelled
        console.log('Purchase cancelled by user');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      const message = isStoreNotConfiguredError(error)
        ? "Purchases aren't available in this build. Set up App Store Connect and Google Play Console for real purchases — see REVENUECAT_QUICKSTART.md."
        : getErrorMessage(error as Error);
      Alert.alert('Purchase Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await restoreMutation.mutateAsync();

      // Check if user has active entitlement
      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        setIsPro(true);
        Alert.alert('Success', 'Your purchases have been restored!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      const message = isStoreNotConfiguredError(error)
        ? "Restore isn't available in this build. Set up App Store Connect and Google Play Console first."
        : getErrorMessage(error as Error);
      Alert.alert('Restore Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {isLoadingOfferings ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.status.active} />
          <Text style={styles.loadingText}>LOADING OFFERS...</Text>
        </View>
      ) : offeringsError || !offering ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.status.error} />
          <Text style={styles.errorTitle}>UNABLE TO LOAD OFFERS</Text>
          <Text style={styles.errorText}>Please check your connection and try again.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchOfferings()}>
            <Text style={styles.retryButtonText}>RETRY</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Visual Hook - Premium Feature Preview (FOMO) */}
          <PremiumPreview />

          {/* 2. Authority Hero */}
          <View style={styles.heroSection}>
            <View style={styles.proBadge}>
              <Ionicons name="star" size={14} color={theme.colors.status.rest} />
              <Text style={styles.proBadgeText}>PRO ACCESS</Text>
            </View>
            <Text style={styles.heroTitle}>UNLOCK{'\n'}PRO FEATURES</Text>
            <Text style={styles.authorityText}>ADVANCED TRACKING & ANALYTICS</Text>
          </View>

          {/* 3. Outcome Benefits (not features) */}
          <BenefitsRow />

          {/* 4. Feature Value Stack */}
          <FeatureStack />

          {/* 5. Package Selector */}
          {offering?.availablePackages && offering.availablePackages.length > 1 && selectedPackage && (
            <PackageSelector
              packages={offering.availablePackages}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
            />
          )}

          {/* 6. Pricing (last - price-last principle) */}
          <PricingDisplay packageInfo={selectedPackage} />

          {/* 7. Single CTA */}
          <UnlockButton onPress={handleUpgrade} isLoading={isLoading} />

          {/* Restore Purchases Link */}
          <Pressable
            onPress={handleRestorePurchases}
            disabled={isLoading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.restoreButton}
          >
            <Text style={styles.restoreText}>RESTORE PURCHASES</Text>
          </Pressable>
        </ScrollView>
      )}
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
  header: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.l,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.status.rest,
  },
  heroTitle: {
    ...typographyStyles.h1,
    fontSize: 42,
    lineHeight: 48,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    letterSpacing: -2,
  },
  authorityText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  loadingText: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
