import type { BodyMeasurement, WeightHistoryEntry } from '@/api/types';
import { extractResults } from '@/api/types/pagination';
import { MiniTrendGraph } from '@/components/calculations/MiniTrendGraph';
import { NeuralTrendChart } from '@/components/calculations/NeuralTrendChart';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { useMeasurements } from '@/hooks/useMeasurements';
import { useUpdateWeight, useUser, useWeightHistory } from '@/hooks/useUser';
import { logger } from '@/lib/logger';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActiveTab = 'biometrics' | 'calculator';

const REP_PERCENTAGES = [95, 90, 85, 80, 75, 70] as const;

const parseNumericValue = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatMetricValue = (
  value: number | string | null | undefined,
  fallback: string,
  fractionDigits: number = 1
) => {
  const parsed = parseNumericValue(value);
  return parsed === null ? fallback : parsed.toFixed(fractionDigits);
};

const formatHistoryDate = (date: string) =>
  new Date(date)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();

export default function MeasurementsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { width: viewportWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<ActiveTab>('biometrics');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [calculatedMax, setCalculatedMax] = useState<number | null>(null);
  const [modals, setModals] = useState({ weight: false, bodyFat: false });
  const [tempVal, setTempVal] = useState('');

  const { data: measurementsData } = useMeasurements();
  const { data: userData } = useUser();
  const { data: weightHistoryData } = useWeightHistory();
  const updateWeightMutation = useUpdateWeight();

  const measurements = useMemo(() => {
    if (!measurementsData) return [];
    return extractResults(measurementsData) as BodyMeasurement[];
  }, [measurementsData]);

  const weightHistory = useMemo(() => weightHistoryData?.results || [], [weightHistoryData]);

  const measurementsAsc = useMemo(
    () =>
      [...measurements].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [measurements]
  );

  const sortedHistory = useMemo(
    () =>
      [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [weightHistory]
  );

  const historyAsc = useMemo(() => [...sortedHistory].reverse(), [sortedHistory]);

  const latestBodyFat = useMemo(() => {
    const latestMeasurement = measurementsAsc[measurementsAsc.length - 1];
    return parseNumericValue(latestMeasurement?.body_fat_percentage);
  }, [measurementsAsc]);

  const bodyFatSeries = useMemo(
    () =>
      measurementsAsc
        .map((entry) => parseNumericValue(entry.body_fat_percentage))
        .filter((value): value is number => value !== null),
    [measurementsAsc]
  );

  const weightGraphData = useMemo(
    () => historyAsc.slice(-10).map((item) => item.weight),
    [historyAsc]
  );
  const weightMiniData = useMemo(
    () => historyAsc.slice(-7).map((item) => item.weight),
    [historyAsc]
  );
  const bodyFatGraphData = useMemo(() => bodyFatSeries.slice(-10), [bodyFatSeries]);
  const bodyFatMiniData = useMemo(() => bodyFatSeries.slice(-7), [bodyFatSeries]);

  const currentWeight = userData?.weight ?? null;

  const sectionWidth = Math.min(Math.max(viewportWidth - theme.spacing.m * 2, 0), 720);
  const isCompactCards = sectionWidth < 420;
  const biometricCardWidth = isCompactCards ? sectionWidth : (sectionWidth - theme.spacing.m) / 2;
  const miniGraphWidth = Math.max(biometricCardWidth - theme.spacing.xl * 2, 0);
  const trendChartWidth = Math.max(sectionWidth - theme.spacing.xl * 2, 0);
  const percentageColumns = sectionWidth >= 540 ? 3 : 2;
  const percentageItemWidth =
    (sectionWidth - theme.spacing.s * (percentageColumns - 1)) / percentageColumns;
  const useCompactHistory = sectionWidth < 390;

  useEffect(() => {
    const weight = parseNumericValue(calcWeight);
    const reps = parseInt(calcReps, 10);

    if (weight === null || weight <= 0 || Number.isNaN(reps) || reps <= 0) {
      setCalculatedMax(null);
      return;
    }

    if (reps === 1) {
      setCalculatedMax(weight);
      return;
    }

    if (reps >= 37) {
      setCalculatedMax(null);
      return;
    }

    setCalculatedMax(weight * (36 / (37 - reps)));
  }, [calcWeight, calcReps]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['measurements'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['weight-history'] });
  };

  const handleShareMax = () => {
    if (!calculatedMax) return;

    Share.share({
      message: `My estimated 1RM is ${calculatedMax.toFixed(1)} kg on FORCE.`,
    });
  };

  const openWeightModal = () => {
    setTempVal(currentWeight?.toString() || '');
    setModals((prev) => ({ ...prev, weight: true }));
  };

  const closeWeightModal = () => {
    setModals((prev) => ({ ...prev, weight: false }));
    setTempVal('');
  };

  const handleSaveWeight = async () => {
    const weight = parseNumericValue(tempVal);
    if (weight === null || weight <= 0) return;

    try {
      await updateWeightMutation.mutateAsync(weight);
      closeWeightModal();
    } catch (error) {
      logger.error('Failed to update weight', error);
    }
  };

  const biometricsHeader = (
    <>
      <View style={[styles.sectionShell, styles.cardsRow]}>
        <Pressable
          style={[styles.biometricCard, { width: biometricCardWidth }]}
          onPress={openWeightModal}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="scale-outline" size={16} color={theme.colors.text.brand} />
              <Text style={styles.cardLabel}>Body weight</Text>
            </View>
            <Ionicons name="create-outline" size={18} color={theme.colors.text.secondary} />
          </View>

          <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{formatMetricValue(currentWeight, '--')}</Text>
            <Text style={styles.cardUnit}>kg</Text>
          </View>

          <View style={styles.cardTrendArea}>
            {weightMiniData.length >= 2 ? (
              <MiniTrendGraph
                data={weightMiniData}
                color={theme.colors.text.brand}
                width={miniGraphWidth}
              />
            ) : (
              <Text style={styles.cardHint}>Add one more weight entry to unlock the trend.</Text>
            )}
          </View>
        </Pressable>

        <Pressable
          style={[styles.biometricCard, { width: biometricCardWidth }]}
          onPress={() => setModals((prev) => ({ ...prev, bodyFat: true }))}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="body-outline" size={16} color={theme.colors.status.rest} />
              <Text style={styles.cardLabel}>Body fat</Text>
            </View>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={theme.colors.status.rest}
            />
          </View>

          <View style={styles.cardValueRow}>
            <Text style={styles.cardValue}>{formatMetricValue(latestBodyFat, '--')}</Text>
            <Text style={styles.cardUnit}>%</Text>
          </View>

          <View style={styles.cardTrendArea}>
            {bodyFatMiniData.length >= 2 ? (
              <MiniTrendGraph
                data={bodyFatMiniData}
                color={theme.colors.status.rest}
                width={miniGraphWidth}
              />
            ) : (
              <Text style={styles.cardHint}>
                Your latest saved body-fat estimate will appear here.
              </Text>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.sectionShell}>
        <View style={styles.graphCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderMain}>
              <View style={styles.sectionIcon}>
                <Ionicons name="stats-chart" size={20} color={theme.colors.text.brand} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Progress trend</Text>
                <Text style={styles.sectionSubtitle}>Weight and body-fat history</Text>
              </View>
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotBrand]} />
                <Text style={styles.legendText}>Weight</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotRest]} />
                <Text style={styles.legendText}>Body fat</Text>
              </View>
            </View>
          </View>

          <NeuralTrendChart
            width={trendChartWidth}
            weightData={weightGraphData}
            bodyFatData={bodyFatGraphData}
          />
        </View>
      </View>

      <View style={[styles.sectionShell, styles.historyHeader]}>
        <View>
          <Text style={styles.historySectionTitle}>History</Text>
          <Text style={styles.historySectionSubtitle}>Newest entries first.</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>
    </>
  );

  const renderHistoryItem = ({ item }: { item: WeightHistoryEntry }) => (
    <View style={styles.sectionShell}>
      <View style={[styles.historyItem, useCompactHistory && styles.historyItemCompact]}>
        <View style={styles.historyContent}>
          <Text style={styles.historyDate}>{formatHistoryDate(item.date)}</Text>

          <View
            style={[
              styles.historyMetricsContainer,
              useCompactHistory && styles.historyMetricsContainerCompact,
            ]}
          >
            <View style={styles.historyMetric}>
              <Text style={styles.historyMetricLabel}>Weight</Text>
              <View style={styles.historyMetricValueRow}>
                <Text style={styles.historyValue}>{formatMetricValue(item.weight, '--')}</Text>
                <Text style={styles.historyUnit}>kg</Text>
              </View>
            </View>

            <View style={styles.historySeparator} />

            <View style={styles.historyMetric}>
              <Text style={styles.historyMetricLabel}>Body fat</Text>
              <View style={styles.historyMetricValueRow}>
                <Text style={styles.historyBfValue}>{formatMetricValue(item.bodyfat, '--.-')}</Text>
                <Text style={styles.historyBfUnit}>%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCalculator = () => (
    <View style={[styles.sectionShell, styles.calcContainer]}>
      <View style={styles.calcCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderMain}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calculator" size={20} color={theme.colors.text.brand} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>1RM calculator</Text>
              <Text style={styles.sectionSubtitle}>Brzycki estimate</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputStack}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight lifted</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="barbell-outline"
                size={18}
                color={theme.colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={calcWeight}
                onChangeText={setCalcWeight}
                keyboardType="decimal-pad"
                placeholder="100.0"
                placeholderTextColor={theme.colors.text.tertiary}
              />
              <Text style={styles.inputSuffix}>kg</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reps completed</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="repeat-outline"
                size={18}
                color={theme.colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={calcReps}
                onChangeText={setCalcReps}
                keyboardType="number-pad"
                placeholder="5"
                placeholderTextColor={theme.colors.text.tertiary}
              />
              <Text style={styles.inputSuffix}>reps</Text>
            </View>
          </View>
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Estimated 1-rep max</Text>
          <View style={styles.resultValueRow}>
            <Text style={[styles.resultValue, !calculatedMax && styles.resultValueMuted]}>
              {calculatedMax ? calculatedMax.toFixed(1) : '--.-'}
            </Text>
            <Text style={styles.resultUnit}>kg</Text>
          </View>

          {calculatedMax && (
            <Pressable style={styles.shareButton} onPress={handleShareMax}>
              <Ionicons name="share-outline" size={16} color={theme.colors.text.brand} />
              <Text style={styles.shareButtonText}>Share estimate</Text>
            </Pressable>
          )}
        </View>
      </View>

      {calculatedMax && (
        <View style={styles.percentageCard}>
          <Text style={styles.historySectionTitle}>Training weight guide</Text>
          <Text style={styles.percentageSubtitle}>Use these percentages for working sets.</Text>

          <View style={styles.percentageGrid}>
            {REP_PERCENTAGES.map((pct) => (
              <View key={pct} style={[styles.pctItem, { width: percentageItemWidth }]}>
                <Text style={styles.pctLabel}>{pct}%</Text>
                <Text style={styles.pctValue}>
                  {(calculatedMax * (pct / 100)).toFixed(1)}
                  <Text style={styles.pctUnit}> kg</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.secondary} />
        <Text style={styles.infoText}>
          Best for hard sets of 10 reps or fewer. Higher rep sets produce a rough estimate.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ExpoLinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <View style={[styles.sectionShell, styles.tabHeader]}>
        <Pressable
          style={[styles.tabItem, activeTab === 'biometrics' && styles.tabItemActive]}
          onPress={() => setActiveTab('biometrics')}
        >
          <Text style={[styles.tabText, activeTab === 'biometrics' && styles.tabTextActive]}>
            Body metrics
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'calculator' && styles.tabItemActive]}
          onPress={() => setActiveTab('calculator')}
        >
          <Text style={[styles.tabText, activeTab === 'calculator' && styles.tabTextActive]}>
            1RM calculator
          </Text>
        </Pressable>
      </View>

      {activeTab === 'biometrics' ? (
        <FlatList
          data={sortedHistory}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + theme.spacing.navHeight + theme.spacing.l },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={biometricsHeader}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            <View style={[styles.sectionShell, styles.emptyState]}>
              <Ionicons name="scale-outline" size={36} color={theme.colors.text.secondary} />
              <Text style={styles.emptyTitle}>No measurement history yet</Text>
              <Text style={styles.emptyText}>
                Save your weight to start tracking changes over time.
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + theme.spacing.navHeight + theme.spacing.l },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCalculator()}
        </ScrollView>
      )}

      <Modal
        visible={modals.weight}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeWeightModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeWeightModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update body weight</Text>
            <Text style={styles.modalDescription}>
              Save your current body weight. This adds a new entry to your progress history.
            </Text>

            <View style={styles.bigInputWrapper}>
              <TextInput
                style={styles.bigInput}
                value={tempVal}
                onChangeText={setTempVal}
                keyboardType="decimal-pad"
                autoFocus
                placeholder="80.0"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <Text style={styles.bigInputSuffix}>kg</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.btnCancel} onPress={closeWeightModal}>
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.btnSave,
                  (updateWeightMutation.isPending ||
                    parseNumericValue(tempVal) === null ||
                    parseNumericValue(tempVal) === 0) &&
                    styles.btnSaveDisabled,
                ]}
                onPress={handleSaveWeight}
                disabled={
                  updateWeightMutation.isPending ||
                  parseNumericValue(tempVal) === null ||
                  parseNumericValue(tempVal) === 0
                }
              >
                <Text style={styles.btnSaveText}>
                  {updateWeightMutation.isPending ? 'Saving...' : 'Save weight'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modals.bodyFat}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setModals((prev) => ({ ...prev, bodyFat: false }))}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModals((prev) => ({ ...prev, bodyFat: false }))}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>About body-fat data</Text>
            <Text style={styles.modalDescription}>
              This screen shows your latest saved body-fat estimate. It is read-only here, so the
              value updates only when a measurement entry with body-fat data is added to your
              account.
            </Text>
            <Pressable
              style={styles.modalSingleAction}
              onPress={() => setModals((prev) => ({ ...prev, bodyFat: false }))}
            >
              <Text style={styles.btnSaveText}>Got it</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  sectionShell: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },

  tabHeader: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  tabItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  tabItemActive: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  },
  tabText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  tabTextActive: {
    color: theme.colors.text.primary,
  },

  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  biometricCard: {
    ...commonStyles.glassPanel,
    minHeight: 220,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  cardLabel: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.l,
  },
  cardValue: {
    ...typographyStyles.h2,
  },
  cardUnit: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
    opacity: 0.8,
  },
  cardTrendArea: {
    minHeight: 60,
    justifyContent: 'flex-end',
    marginTop: theme.spacing.l,
  },
  cardHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
  },

  graphCard: {
    ...commonStyles.glassPanel,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
    marginBottom: theme.spacing.m,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  sectionHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    flex: 1,
  },
  sectionHeaderText: {
    flexShrink: 1,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
  },
  sectionTitle: {
    ...typographyStyles.h4,
    fontSize: theme.typography.sizes.l,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
    marginTop: theme.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotBrand: {
    backgroundColor: theme.colors.text.brand,
  },
  legendDotRest: {
    backgroundColor: theme.colors.status.rest,
  },
  legendText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xs,
  },
  historySectionTitle: {
    ...typographyStyles.labelMuted,
    color: theme.colors.text.secondary,
  },
  historySectionSubtitle: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  refreshText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },
  historyItem: {
    ...commonStyles.glassPanel,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.s,
  },
  historyItemCompact: {
    paddingVertical: theme.spacing.l,
  },
  historyContent: {
    gap: theme.spacing.m,
  },
  historyDate: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.tertiary,
  },
  historyMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  historyMetricsContainerCompact: {
    flexDirection: 'column',
    gap: theme.spacing.m,
  },
  historyMetric: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  historyMetricLabel: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },
  historyMetricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  historySeparator: {
    width: 1,
    marginHorizontal: theme.spacing.l,
    backgroundColor: theme.colors.ui.border,
  },
  historyValue: {
    ...typographyStyles.h3,
    fontSize: theme.typography.sizes.xl,
  },
  historyUnit: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '900',
    marginLeft: theme.spacing.xs,
  },
  historyBfValue: {
    ...typographyStyles.h3,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.status.rest,
  },
  historyBfUnit: {
    color: theme.colors.status.rest,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '900',
    marginLeft: theme.spacing.xs,
    opacity: 0.8,
  },

  calcContainer: {
    gap: theme.spacing.m,
  },
  calcCard: {
    ...commonStyles.glassPanel,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
  },
  inputStack: {
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    backgroundColor: theme.colors.background,
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '700',
  },
  inputSuffix: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.tertiary,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
  },
  resultLabel: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  resultValue: {
    ...typographyStyles.h1,
    color: theme.colors.text.brand,
  },
  resultValueMuted: {
    color: theme.colors.text.tertiary,
    opacity: 0.45,
  },
  resultUnit: {
    ...typographyStyles.label,
    color: theme.colors.text.brand,
    marginLeft: theme.spacing.xs,
    opacity: 0.7,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
  },
  shareButtonText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.brand,
  },

  percentageCard: {
    ...commonStyles.glassPanel,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
  },
  percentageSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 4,
    marginBottom: theme.spacing.m,
  },
  percentageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  pctItem: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    alignItems: 'center',
  },
  pctLabel: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  pctValue: {
    ...typographyStyles.data,
    fontSize: theme.typography.sizes.l,
  },
  pctUnit: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
  },

  infoCard: {
    ...commonStyles.glassPanel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
  },
  infoText: {
    flex: 1,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
  },

  emptyState: {
    ...commonStyles.glassPanel,
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.s,
  },
  emptyTitle: {
    ...typographyStyles.h4,
    fontSize: theme.typography.sizes.l,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.l,
    backgroundColor: 'rgba(2, 2, 5, 0.82)',
  },
  modalCard: {
    ...commonStyles.glassStrong,
    width: '100%',
    maxWidth: 420,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
  },
  modalTitle: {
    ...typographyStyles.h4,
    marginBottom: theme.spacing.s,
  },
  modalDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.s,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  bigInputWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.xl,
  },
  bigInput: {
    ...typographyStyles.h2,
    minWidth: 100,
    textAlign: 'center',
  },
  bigInputSuffix: {
    ...typographyStyles.label,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  btnCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.secondary,
  },
  btnSave: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveDisabled: {
    opacity: 0.45,
  },
  btnSaveText: {
    ...typographyStyles.labelTight,
    color: theme.colors.text.primary,
  },
  modalSingleAction: {
    minHeight: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
