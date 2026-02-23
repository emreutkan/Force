import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useChatStore } from '@/state/userStore';
import { theme, commonStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChatSession } from '@/api/types';

const CAPABILITIES = [
  { icon: 'barbell-outline' as const, label: 'PROGRAMMING', color: theme.colors.status.active },
  { icon: 'body-outline' as const, label: 'FORM TIPS', color: theme.colors.status.success },
  { icon: 'restaurant-outline' as const, label: 'NUTRITION', color: theme.colors.status.warning },
  { icon: 'pulse-outline' as const, label: 'RECOVERY', color: theme.colors.status.rest },
];

export default function ChatHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, isLoading, fetchSessions, removeSession, clearActiveSession } = useChatStore();

  // FAB pulse animation
  const pulseValue = useSharedValue(1);
  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, []);
  const fabPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  useEffect(() => {
    clearActiveSession();
    fetchSessions();
  }, []);

  // Filter out empty sessions (ghost sessions from old code)
  const activeSessions = sessions.filter((s) => s.messages && s.messages.length > 0);

  const handleNewChat = useCallback(() => {
    router.push('/(chat)/new');
  }, []);

  const handleOpenSession = useCallback((session: ChatSession) => {
    router.push(`/(chat)/${session.id}`);
  }, []);

  const handleDeleteSession = useCallback(
    (session: ChatSession) => {
      Alert.alert('DELETE CHAT', `Delete "${session.title}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeSession(session.id),
        },
      ]);
    },
    [removeSession]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderSessionItem = ({ item, index }: { item: ChatSession; index: number }) => {
    const messageCount = item.messages?.length || 0;

    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
        <Pressable
          style={styles.sessionCard}
          onPress={() => handleOpenSession(item)}
          onLongPress={() => handleDeleteSession(item)}
        >
          <View style={[styles.sessionIconContainer, commonStyles.shadow]}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.1)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="sparkles" size={18} color={theme.colors.status.active} />
          </View>

          <View style={styles.sessionContent}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {item.title || 'New Chat'}
            </Text>
            <Text style={styles.sessionMeta}>
              {messageCount > 0 ? `${messageCount} messages` : 'No messages'}
              {'  ·  '}
              {formatDate(item.updated_at || item.created_at)}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.text.tertiary}
            style={{ opacity: 0.5 }}
          />
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyContainer}>
        {/* Decorative divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Ionicons name="sparkles" size={10} color={theme.colors.text.tertiary} />
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.emptyTitle}>YOUR AI COACH</Text>
        <Text style={styles.emptySubtitle}>
          Ask about training programs, form corrections, nutrition, and recovery strategies.
        </Text>

        {/* Capability chips */}
        <View style={styles.capabilitiesGrid}>
          {CAPABILITIES.map((cap, i) => (
            <Animated.View
              key={cap.label}
              entering={FadeInUp.delay(300 + i * 80).duration(400)}
              style={styles.capabilityChip}
            >
              <View style={[styles.capabilityIcon, { backgroundColor: `${cap.color}1A` }]}>
                <Ionicons name={cap.icon} size={14} color={cap.color} />
              </View>
              <Text style={styles.capabilityLabel}>{cap.label}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Hero section */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.aiIdentity}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.aiAvatarLarge}
          >
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 0.08)']}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="sparkles" size={28} color={theme.colors.status.active} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={styles.heroTitle}>
            FORCE AI
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.heroTagline}>
            NEURAL TRAINING ASSISTANT
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Section label */}
      {activeSessions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>HISTORY</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Dual-layer AI gradient */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.08)', 'transparent']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Session list */}
      {isLoading && sessions.length === 0 ? (
        <>
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.status.active} />
          </View>
        </>
      ) : (
        <FlatList
          data={activeSessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSessionItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating new chat button with pulse */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={[styles.fabContainer, { bottom: insets.bottom + 24 }, fabPulseStyle]}
      >
        <Pressable style={styles.fab} onPress={handleNewChat}>
          <LinearGradient
            colors={[theme.colors.status.active, '#4f46e5']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.fabText}>NEW CHAT</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Hero
  heroSection: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  aiIdentity: {
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing.l,
    gap: theme.spacing.s,
  },
  aiAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h2,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
  },
  heroTagline: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
    color: theme.colors.text.tertiary,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: theme.spacing.m + theme.spacing.xs,
    marginBottom: theme.spacing.s,
  },
  sectionLabel: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
    color: theme.colors.text.tertiary,
  },

  // List
  listContent: {
    paddingHorizontal: theme.spacing.m,
  },

  // Session cards
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    gap: 12,
  },
  sessionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.ui.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sessionContent: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    fontSize: theme.typography.sizes.mono,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionMeta: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.m,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  dividerLine: {
    height: 1,
    width: 32,
    backgroundColor: theme.colors.ui.border,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h3,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  capabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  capabilityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capabilityLabel: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.colors.text.secondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.m,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  fabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
