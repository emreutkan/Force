import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import type { CoachReviewResponse } from '@/api/types/workout';
import AnalysisRow from './analysisRow';

interface CoachReviewSectionProps {
  coachReview: CoachReviewResponse;
}

export default function CoachReviewSection({ coachReview }: CoachReviewSectionProps) {
  const { what_went_right, what_went_wrong, what_to_change_next_time, summary } = coachReview;

  const hasContent =
    what_went_right.length > 0 || what_went_wrong.length > 0 || what_to_change_next_time.length > 0;

  if (!hasContent) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name="sparkles" size={14} color={theme.colors.status.active} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>COACH REVIEW</Text>
          <Text style={styles.sectionSubtitle}>AI ANALYSIS</Text>
        </View>
        {summary.finding_count > 0 && (
          <View style={styles.summaryChips}>
            {summary.positive_count > 0 && (
              <View style={[styles.chip, styles.chipPositive]}>
                <Text style={[styles.chipText, styles.chipTextPositive]}>{summary.positive_count}+</Text>
              </View>
            )}
            {summary.issue_count > 0 && (
              <View style={[styles.chip, styles.chipNegative]}>
                <Text style={[styles.chipText, styles.chipTextNegative]}>{summary.issue_count}!</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* What went right */}
      {what_went_right.length > 0 && (
        <View style={[styles.card, styles.cardPositive]}>
          <View style={[styles.cardAccent, styles.cardAccentPositive]} />
          <View style={styles.cardInner}>
            {what_went_right.length >= 3 ? (
              <View style={styles.cardTitleRow}>
                <Ionicons name="star" size={10} color={theme.colors.status.rest} />
                <Text style={[styles.cardTitle, styles.cardTitlePositive, styles.cardTitleNoMargin]}>WHAT WENT RIGHT</Text>
              </View>
            ) : (
              <Text style={[styles.cardTitle, styles.cardTitlePositive]}>WHAT WENT RIGHT</Text>
            )}
            {what_went_right.map((finding, i) => (
              <AnalysisRow key={i} message={finding.message} type="positive" />
            ))}
          </View>
        </View>
      )}

      {/* What went wrong */}
      {what_went_wrong.length > 0 && (
        <View style={[styles.card, styles.cardNegative]}>
          <View style={[styles.cardAccent, styles.cardAccentNegative]} />
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, styles.cardTitleNegative]}>WHAT WENT WRONG</Text>
            {what_went_wrong.map((finding, i) => (
              <AnalysisRow key={i} message={finding.message} type="negative" />
            ))}
          </View>
        </View>
      )}

      {/* What to change next time */}
      {what_to_change_next_time.length > 0 && (
        <View style={[styles.card, styles.cardNeutral]}>
          <View style={[styles.cardAccent, styles.cardAccentNeutral]} />
          <View style={styles.cardInner}>
            <Text style={[styles.cardTitle, styles.cardTitleNeutral]}>NEXT TIME</Text>
            {what_to_change_next_time.map((item, i) => (
              <AnalysisRow key={i} message={item.message} type="neutral" />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.label,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  summaryChips: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  chip: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  chipPositive: {
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderColor: 'rgba(192,132,252,0.3)',
  },
  chipNegative: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipTextPositive: {
    color: theme.colors.status.rest,
  },
  chipTextNegative: {
    color: theme.colors.status.error,
  },
  card: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardPositive: {
    backgroundColor: 'rgba(192,132,252,0.04)',
    borderColor: 'rgba(192,132,252,0.15)',
  },
  cardNegative: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderColor: 'rgba(239,68,68,0.15)',
  },
  cardNeutral: {
    backgroundColor: theme.colors.ui.glass,
    borderColor: theme.colors.ui.border,
  },
  cardAccent: {
    width: 3,
  },
  cardAccentPositive: {
    backgroundColor: theme.colors.status.rest,
  },
  cardAccentNegative: {
    backgroundColor: theme.colors.status.error,
  },
  cardAccentNeutral: {
    backgroundColor: theme.colors.status.active,
  },
  cardInner: {
    flex: 1,
    padding: 16,
    paddingLeft: 14,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardTitlePositive: {
    color: theme.colors.status.rest,
    fontStyle: 'italic',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitleNoMargin: {
    marginBottom: 0,
  },
  cardTitleNegative: {
    color: theme.colors.status.error,
  },
  cardTitleNeutral: {
    color: theme.colors.status.active,
  },
});
