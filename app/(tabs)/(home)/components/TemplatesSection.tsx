import { TemplateWorkout } from '@/api/types/index';
import UpgradeModal from '@/components/UpgradeModal';
import { theme, typographyStyles } from '@/constants/theme';
import { logger } from '@/lib/logger';
import { useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, Pressable, View } from 'react-native';
import { useTemplateWorkouts, useDeleteTemplateWorkout, useStartTemplateWorkout } from '@/hooks/useWorkout';
import { TemplatesSectionSkeleton } from './homeLoadingSkeleton';

const FREE_TEMPLATE_LIMIT = 3;

const keyExtractor = (item: TemplateWorkout) => item.id.toString();

function EmptyTemplateCard() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="duplicate-outline" size={32} color={theme.colors.text.zinc800} />
      <Text style={styles.emptyText}>NO TEMPLATES YET</Text>
    </View>
  );
}

export default function TemplatesSection() {
  const { data: user } = useUser();
  const isPro = user?.is_pro ?? false;
  const { data: templatesData, refetch, isLoading: templatesLoading } = useTemplateWorkouts();
  const deleteTemplateMutation = useDeleteTemplateWorkout();
  const startTemplateMutation = useStartTemplateWorkout();
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const templates = Array.isArray(templatesData) ? templatesData : [];
  const canCreateTemplate = isPro || templates.length < FREE_TEMPLATE_LIMIT;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleCreatePress = useCallback(() => {
    if (!canCreateTemplate) {
      setShowUpgradeModal(true);
    } else {
      router.push('/(templates)/create');
    }
  }, [canCreateTemplate]);

  const handleTemplatePress = useCallback((template: TemplateWorkout) => {
    Alert.alert(template.title.toUpperCase(), 'What would you like to do?', [
      {
        text: 'Start Workout',
        onPress: async () => {
          try {
            const res = await startTemplateMutation.mutateAsync({ template_workout_id: template.id });
            if (res?.id) router.push('/(active-workout)');
          } catch (error) {
            logger.error('Error starting template workout', error);
            Alert.alert('Error', 'Failed to start workout');
          }
        },
      },
      {
        text: 'Delete Template',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteTemplateMutation.mutateAsync(template.id);
                } catch (error) {
                  logger.error('Error deleting template', error);
                  Alert.alert('Error', 'Failed to delete template');
                }
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [deleteTemplateMutation, startTemplateMutation]);

  if (templatesLoading) {
    return <TemplatesSectionSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIndicator} />
          <Text style={styles.sectionTitle}>WORKOUT TEMPLATES</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            !canCreateTemplate && styles.createButtonDisabled,
            pressed && canCreateTemplate && { transform: [{ scale: 0.96 }], opacity: 0.8 }
          ]}
          onPress={handleCreatePress}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createButtonText}>NEW</Text>
          {!isPro && (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>
                {templates.length}/{FREE_TEMPLATE_LIMIT}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={templates}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateList}
        snapToInterval={260 + theme.spacing.m}
        decelerationRate="fast"
        renderItem={({ item: tpl }) => (
          <Pressable
            style={({ pressed }) => [
              styles.templateCard,
              pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 }
            ]}
            onPress={() => handleTemplatePress(tpl)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.templateIcon}>
                <Ionicons name="fitness" size={20} color={theme.colors.status.active} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.templateName} numberOfLines={1}>
                  {tpl.title.toUpperCase()}
                </Text>
                <Text style={styles.templateSubtitle}>PRE-SET DRILL</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.metricItem}>
                <Ionicons name="list" size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.metricText}>{tpl.exercises.length} EXERCISES</Text>
              </View>
              <View style={styles.startButton}>
                <Ionicons name="play" size={12} color="#FFFFFF" />
                <Text style={styles.startButtonText}>START</Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={EmptyTemplateCard}
      />

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Unlimited Workout Templates"
        message={`Free users can create up to ${FREE_TEMPLATE_LIMIT} templates. Upgrade to PRO for unlimited template creation.`}
      />
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glassStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  limitBadge: {
    backgroundColor: theme.colors.status.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  limitText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
  },
  templateList: {
    paddingHorizontal: 2,
    gap: theme.spacing.m,
    paddingBottom: 8,
  },
  templateCard: {
    width: 260,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.l,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.05)',
  },
  headerInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  templateSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.status.active,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  startButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  emptyCard: {
    width: 260,
    height: 100,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.text.zinc800,
    letterSpacing: 1,
  },
});
