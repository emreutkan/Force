import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import {
  GiftedChat,
  IMessage,
  Bubble,
  Send,
  InputToolbar,
  Composer,
} from 'react-native-gifted-chat';
import { useChatStore } from '@/state/userStore';
import { useUser } from '@/hooks/useUser';
import { theme, commonStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';

const SUGGESTIONS = [
  {
    icon: 'barbell-outline' as const,
    label: 'Build a push/pull/legs split',
    prompt: 'Help me build a push/pull/legs training split',
  },
  {
    icon: 'trending-up-outline' as const,
    label: 'Break through a plateau',
    prompt: "I'm stuck on my bench press. How do I break through a plateau?",
  },
  {
    icon: 'pulse-outline' as const,
    label: 'Optimize my recovery',
    prompt: 'What are the best recovery strategies between heavy sessions?',
  },
  {
    icon: 'restaurant-outline' as const,
    label: 'Dial in my nutrition',
    prompt: 'Help me plan my nutrition for muscle building',
  },
];

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const isNewChat = id === 'new';
  const sessionId = !isNewChat && id ? parseInt(id, 10) : null;

  const { activeSession, fetchSession, startSession, sendMessage, isSending } = useChatStore();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const sessionCreated = useRef(false);

  // Typing indicator dot animations
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    if (isSending) {
      dot1.value = withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
        -1,
        true
      );
      dot2.value = withDelay(
        150,
        withRepeat(
          withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
          -1,
          true
        )
      );
      dot3.value = withDelay(
        300,
        withRepeat(
          withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })),
          -1,
          true
        )
      );
    } else {
      dot1.value = withTiming(0.3, { duration: 200 });
      dot2.value = withTiming(0.3, { duration: 200 });
      dot3.value = withTiming(0.3, { duration: 200 });
    }
  }, [isSending]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  const formatMessages = useCallback(
    (backendMessages: any[] = []): IMessage[] => {
      return backendMessages
        .map((msg) => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.role === 'user' ? 1 : 2,
            name: msg.role === 'user' ? user?.email?.split('@')[0] || 'You' : 'Force AI',
          },
        }))
        .reverse(); // Backend returns oldest→newest, GiftedChat needs newest→oldest
    },
    [user]
  );

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else if (isNewChat && !sessionCreated.current) {
      sessionCreated.current = true;
      startSession('New AI Chat');
    }
  }, [sessionId, isNewChat]);

  useEffect(() => {
    if (activeSession?.messages) {
      setMessages(formatMessages(activeSession.messages));
    }
  }, [activeSession?.messages, formatMessages]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!activeSession?.id) return;
      const messageText = newMessages[0].text;
      sendMessage(activeSession.id, messageText);
    },
    [activeSession?.id, sendMessage]
  );

  const handleSuggestionTap = useCallback(
    (prompt: string) => {
      if (!activeSession?.id) return;
      sendMessage(activeSession.id, prompt);
    },
    [activeSession?.id, sendMessage]
  );

  const renderMessageText = (props: any) => {
    const isAI = props.currentMessage?.user?._id === 2;
    if (!isAI) {
      return <Text style={styles.bubbleTextRight}>{props.currentMessage.text}</Text>;
    }
    return (
      <View style={styles.markdownWrapper}>
        <Markdown style={markdownStyles}>{props.currentMessage.text}</Markdown>
      </View>
    );
  };

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      renderMessageText={renderMessageText}
      wrapperStyle={{
        right: styles.bubbleRight,
        left: styles.bubbleLeft,
      }}
      timeTextStyle={{
        right: styles.timeRight,
        left: styles.timeLeft,
      }}
    />
  );

  const renderSend = (props: any) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendButton}>
        <Ionicons name="arrow-up" size={18} color={theme.colors.text.primary} />
      </View>
    </Send>
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={[
        styles.inputToolbar,
        { marginBottom: Platform.OS === 'ios' ? 4 : insets.bottom + 4 },
      ]}
      primaryStyle={{ alignItems: 'center' }}
    />
  );

  const renderComposer = (props: any) => (
    <Composer
      {...props}
      textInputStyle={styles.composerInput}
      placeholderTextColor={theme.colors.text.tertiary}
      multiline
    />
  );

  // Welcome state for empty conversations
  const renderChatEmpty = () => (
    <View style={styles.welcomeContainer}>
      {/* GiftedChat renders empty inverted — flip it back */}
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>HOW CAN I HELP?</Text>
          <Text style={styles.welcomeSubtitle}>
            Training programs, form corrections, nutrition, recovery — ask anything.
          </Text>

          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion.label}
                style={({ pressed }) => [styles.suggestionChip, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleSuggestionTap(suggestion.prompt)}
              >
                <Ionicons name={suggestion.icon} size={15} color={theme.colors.text.tertiary} />
                <Text style={styles.suggestionText}>{suggestion.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  // Typing indicator
  const renderFooter = () => {
    if (!isSending) return null;
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={styles.typingContainer}>
        <View style={[styles.typingBubble, commonStyles.shadow]}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, dot1Style]} />
            <Animated.View style={[styles.typingDot, dot2Style]} />
            <Animated.View style={[styles.typingDot, dot3Style]} />
          </View>
          <Text style={styles.typingLabel}>THINKING</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={commonStyles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>

        <Text style={styles.headerTitle}>FORCE AI</Text>

        {/* Balance back button width */}
        <View style={styles.headerSpacer} />
      </Animated.View>

      <View style={styles.headerDivider} />

      {/* Chat area */}
      <KeyboardAvoidingView
        style={styles.chatWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <GiftedChat
          messages={messages}
          onSend={(msgs) => onSend(msgs)}
          user={{ _id: 1 }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderChatEmpty={renderChatEmpty}
          renderFooter={renderFooter}
          // @ts-ignore - placeholder exists at runtime
          placeholder="Ask anything..."
          alwaysShowSend
          minInputToolbarHeight={60}
          bottomOffset={insets.bottom}
        />
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.sizes.label,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.label,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 38, // matches backButton width to keep title centered
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.ui.border,
  },
  chatWrapper: {
    flex: 1,
  },

  // Bubble styles
  bubbleRight: {
    backgroundColor: theme.colors.status.active,
    borderRadius: 22,
    borderBottomRightRadius: 4,
    padding: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  bubbleLeft: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: 22,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: 6,
    marginLeft: 8,
    marginBottom: 4,
    marginTop: 4,
  },
  markdownWrapper: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
  },
  bubbleTextRight: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    lineHeight: 24,
  },
  timeRight: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeLeft: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Input styles
  inputToolbar: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderTopWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: theme.spacing.m,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  composerInput: {
    color: theme.colors.text.primary,
    fontSize: 15,
    backgroundColor: 'transparent',
    paddingTop: 10,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.status.active,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Welcome empty state
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  welcomeContent: {
    alignItems: 'center',
    width: '100%',
  },
  welcomeTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: theme.typography.tracking.h3,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: theme.spacing.s,
  },
  welcomeSubtitle: {
    fontSize: theme.typography.sizes.s,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: theme.spacing.xl,
  },
  suggestionsContainer: {
    width: '100%',
    gap: theme.spacing.s,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    padding: theme.spacing.m,
  },
  suggestionText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    letterSpacing: -0.1,
  },

  // Typing indicator
  typingContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.status.active,
  },
  typingLabel: {
    fontSize: theme.typography.sizes.xxs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.wide,
    color: theme.colors.text.tertiary,
  },
});

// Markdown styles for AI responses
const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  heading1: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.l,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.s,
    fontWeight: '800',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 4,
  },
  strong: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
    color: theme.colors.text.secondary,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet_list_icon: {
    color: theme.colors.status.active,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
    marginTop: 2,
  },
  ordered_list_icon: {
    color: theme.colors.status.active,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
    marginTop: 2,
  },
  code_inline: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: theme.colors.text.brand,
    fontFamily: theme.typography.fonts.mono,
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.colors.ui.primaryBorder,
  },
  fence: {
    backgroundColor: 'rgba(9, 9, 11, 0.95)',
    borderColor: theme.colors.ui.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  code_block: {
    backgroundColor: 'transparent',
    fontFamily: theme.typography.fonts.mono,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  blockquote: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderLeftColor: theme.colors.status.active,
    borderLeftWidth: 4,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 10,
  },
  hr: {
    backgroundColor: theme.colors.ui.border,
    height: 1,
    marginVertical: 16,
    opacity: 0.5,
  },
  link: {
    color: theme.colors.text.brand,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  table: {
    borderColor: theme.colors.ui.border,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 12,
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
  },
  th: {
    color: theme.colors.text.primary,
    fontWeight: '800',
    padding: 10,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    color: theme.colors.text.primary,
    padding: 10,
    fontSize: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.ui.border,
  },
  tr: {
    borderBottomWidth: 0,
  },
});
