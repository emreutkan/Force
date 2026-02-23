import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import {
  usePrograms,
  useDeleteProgram,
  useActivateProgram,
  useDeactivateProgram,
  useRenameProgram,
} from '@/hooks/useWorkoutProgram';
import { useProgramStore } from '@/state/stores/programStore';
import type { WorkoutProgram } from '@/api/types/program';

export default function ProgramListScreen() {
  const insets = useSafeAreaInsets();
  const { data: programs = [], isLoading } = usePrograms();
  const deleteProgram = useDeleteProgram();
  const activateProgram = useActivateProgram();
  const deactivateProgram = useDeactivateProgram();
  const renameProgram = useRenameProgram();
  const resetDraft = useProgramStore((s) => s.reset);

  const handleCreate = () => {
    resetDraft();
    router.push('/(workout-program)/create/step1');
  };

  const handleDelete = (program: WorkoutProgram) => {
    Alert.alert('Delete Program', `Delete "${program.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProgram.mutateAsync(program.id);
          } catch {
            Alert.alert('Error', 'Failed to delete program.');
          }
        },
      },
    ]);
  };

  const handleRename = (program: WorkoutProgram) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Program',
        'Enter a new name:',
        async (newName) => {
          if (!newName?.trim()) return;
          try {
            await renameProgram.mutateAsync({ id: program.id, request: { name: newName.trim() } });
          } catch {
            Alert.alert('Error', 'Failed to rename program.');
          }
        },
        'plain-text',
        program.name
      );
    } else {
      Alert.alert(
        'Rename',
        'Renaming is only available on iOS via prompt. Open the detail screen to rename.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleActivate = async (program: WorkoutProgram) => {
    try {
      await activateProgram.mutateAsync(program.id);
    } catch {
      Alert.alert('Error', 'Failed to activate program.');
    }
  };

  const renderItem = ({ item }: { item: WorkoutProgram }) => (
    <Pressable
      style={[styles.card, item.is_active && styles.cardActive]}
      onPress={() => router.push(`/(workout-program)/${item.id}`)}
      onLongPress={() =>
        Alert.alert(item.name, 'What would you like to do?', [
          { text: 'Rename', onPress: () => handleRename(item) },
          {
            text: item.is_active ? 'Deactivate' : 'Activate',
            onPress: () => {
              if (!item.is_active) handleActivate(item);
              else
                Alert.alert('Deactivate?', 'This will deactivate the current program.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Deactivate',
                    onPress: async () => {
                      try {
                        await deactivateProgram.mutateAsync(item.id);
                      } catch {
                        Alert.alert('Error', 'Failed to deactivate program.');
                      }
                    },
                  },
                ]);
            },
          },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
    >
      {item.is_active && <View style={styles.activeAccent} />}
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, item.is_active && styles.cardIconActive]}>
          <Ionicons
            name="calendar-outline"
            size={22}
            color={item.is_active ? theme.colors.status.active : theme.colors.text.tertiary}
          />
        </View>
        <View style={styles.cardText}>
          <Text
            style={[styles.cardTitle, item.is_active && styles.cardTitleActive]}
            numberOfLines={1}
          >
            {item.name.toUpperCase()}
          </Text>
          <Text style={styles.cardSub}>{item.cycle_length}-DAY SPLIT</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        {item.is_active && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(99,101,241,0.13)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color={theme.colors.status.active} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99,101,241,0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MY PROGRAMS</Text>
          <Text style={styles.headerSub}>WORKOUT SPLIT MANAGER</Text>
        </View>
        {programs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{programs.length}</Text>
          </View>
        )}
        <Pressable style={styles.createBtn} onPress={handleCreate}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + theme.spacing.navHeight },
          programs.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={32} color={theme.colors.status.active} />
            </View>
            <Text style={styles.emptyTitle}>NO PROGRAMS YET</Text>
            <Text style={styles.emptySub}>Create a split to organize your training week</Text>
            <Pressable style={styles.emptyBtn} onPress={handleCreate}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>CREATE PROGRAM</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h3,
  },
  headerSub: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '800',
    color: theme.colors.text.tertiary,
    letterSpacing: theme.typography.tracking.label,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.status.active,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  list: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    padding: theme.spacing.m,
  },
  cardActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  activeAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.colors.status.active,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingLeft: 6 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  cardIconActive: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderColor: theme.colors.ui.primaryBorder,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  cardTitleActive: { color: theme.colors.status.active },
  cardSub: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activePill: {
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.colors.status.active,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.ui.brandSurface,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.h4,
    textTransform: 'uppercase',
  },
  emptySub: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.status.active,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.xxl,
    marginTop: theme.spacing.m,
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.s,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
