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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ChatSession } from '@/api/types';

export default function ChatHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, isLoading, fetchSessions, removeSession, clearActiveSession } = useChatStore();

  useEffect(() => {
    clearActiveSession();
    fetchSessions();
  }, []);

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

  const renderSessionItem = ({ item, index }: { item: ChatSession; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
      <Pressable
        style={({ pressed }) => [styles.sessionCard, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => handleOpenSession(item)}
      >
        <View style={styles.sessionIconContainer}>
          <Ionicons name="chatbubble-outline" size={16} color={theme.colors.text.tertiary} />
        </View>

        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.title || 'New Chat'}
          </Text>
          <Text style={styles.sessionMeta}>
            {formatDate(item.updated_at || item.created_at)}
          </Text>
        </View>

        <Pressable
          onPress={() => handleDeleteSession(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.6 })}
        >
          <Ionicons name="trash-outline" size={15} color={theme.colors.text.tertiary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={36} color={theme.colors.text.tertiary} />
        <Text style={styles.emptyTitle}>YOUR AI COACH</Text>
        <Text style={styles.emptySubtitle}>
          Ask about training programs, form corrections, nutrition, and recovery strategies.
        </Text>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={commonStyles.backButton}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
      </Pressable>

      <Text style={styles.headerTitle}>AI COACH</Text>

      {/* Balance back button width */}
      <View style={styles.headerSpacer} />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleNewChat}
        >
          <Ionicons name="add" size={18} color={theme.colors.text.primary} />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 38, // matches backButton width to keep title centered
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
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
    gap: 12,
  },
  sessionIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.1,
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
    paddingTop: theme.spacing.xxxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.m,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h3,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    marginTop: theme.spacing.s,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
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
    gap: theme.spacing.s,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.status.active,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
    color: theme.colors.text.primary,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
});
