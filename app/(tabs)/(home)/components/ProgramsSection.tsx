import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme, typographyStyles } from '@/constants/theme';
import { usePrograms } from '@/hooks/useWorkoutProgram';
import type { WorkoutProgram } from '@/api/types/program';

const keyExtractor = (item: WorkoutProgram) => item.id.toString();

function AddProgramCard() {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.addCard,
        pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
      ]}
      onPress={() => router.push('/(workout-program)/create/step1')}
    >
      <View style={styles.addCardIcon}>
        <Ionicons name="add" size={22} color={theme.colors.status.active} />
      </View>
      <Text style={styles.addCardText}>NEW PROGRAM</Text>
    </Pressable>
  );
}

const ProgramCard = React.memo(function ProgramCard({ program }: { program: WorkoutProgram }) {
  const { workDays, restDays } = useMemo(() => {
    let work = 0, rest = 0;
    for (const d of program.days) {
      if (d.is_rest_day) rest++; else work++;
    }
    return { workDays: work, restDays: rest };
  }, [program.days]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.programCard,
        program.is_active && styles.programCardActive,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
      ]}
      onPress={() => router.push(`/(workout-program)/${program.id}`)}
    >
      {program.is_active && <View style={styles.programActiveBar} />}

      <View style={styles.programCardInner}>
        {/* Header */}
        <View style={styles.programCardHeader}>
          <View style={[styles.programIcon, program.is_active && styles.programIconActive]}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={program.is_active ? theme.colors.status.active : theme.colors.text.tertiary}
            />
          </View>
          {program.is_active && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.programName, program.is_active && styles.programNameActive]} numberOfLines={2}>
          {program.name.toUpperCase()}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workDays}</Text>
            <Text style={styles.statLabel}>WORK</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, restDays > 0 && styles.statValueRest]}>{restDays}</Text>
            <Text style={styles.statLabel}>REST</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{program.cycle_length}</Text>
            <Text style={styles.statLabel}>DAYS</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default function ProgramsSection() {
  const { data: programs = [], isLoading } = usePrograms();

  const renderItem = useCallback(({ item }: { item: WorkoutProgram }) => (
    <ProgramCard program={item} />
  ), []);

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIndicator} />
          <Text style={styles.sectionTitle}>MY PROGRAMS</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.manageBtn,
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.8 }
          ]}
          onPress={() => router.push('/(workout-program)/')}
        >
          <Ionicons name="settings-outline" size={13} color={theme.colors.status.active} />
          <Text style={styles.manageBtnText}>MANAGE</Text>
        </Pressable>
      </View>

      {programs.length === 0 ? (
        /* Empty state — single card CTA */
        <Pressable
          style={({ pressed }) => [
            styles.emptyCard,
            pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 }
          ]}
          onPress={() => router.push('/(workout-program)/create/step1')}
        >
          <View style={styles.emptyIconWrap}>
            <Ionicons name="add" size={20} color={theme.colors.status.active} />
          </View>
          <View style={styles.emptyTextBlock}>
            <Text style={styles.emptyTitle}>CREATE A PROGRAM</Text>
            <Text style={styles.emptySubtitle}>Plan your training split</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
        </Pressable>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          snapToInterval={220 + theme.spacing.m}
          decelerationRate="fast"
          renderItem={renderItem}
          ListFooterComponent={AddProgramCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIndicator: {
    width: 3,
    height: 16,
    backgroundColor: theme.colors.status.active,
    borderRadius: 2,
  },
  sectionTitle: {
    ...typographyStyles.labelMuted,
    color: theme.colors.text.primary,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageBtnText: {
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.active,
    letterSpacing: 0.8,
  },

  // Empty state
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginHorizontal: 2,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextBlock: { flex: 1 },
  emptyTitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },

  // Program cards list
  listContent: {
    paddingHorizontal: 2,
    gap: theme.spacing.m,
    paddingBottom: 4,
  },

  programCard: {
    width: 220,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  programCardActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  programActiveBar: {
    width: 3,
    backgroundColor: theme.colors.status.active,
  },
  programCardInner: {
    flex: 1,
    padding: theme.spacing.l,
  },

  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programIconActive: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  },
  activeBadge: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  programName: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
    marginBottom: theme.spacing.m,
    lineHeight: 18,
  },
  programNameActive: {
    color: theme.colors.status.active,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.ui.border,
    opacity: 0.5,
  },
  statValue: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    fontFamily: theme.typography.fonts.mono,
    color: theme.colors.text.primary,
  },
  statValueRest: {
    color: theme.colors.status.rest,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.tertiary,
  },

  // Add new program card
  addCard: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.l,
    borderStyle: 'dashed',
  },
  addCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
