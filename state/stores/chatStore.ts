import { create } from 'zustand';
import { ChatSession, ChatMessage } from '@/api/types';
import * as chatApi from '@/api/Chat';

export interface ChatState {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  fetchSession: (id: number) => Promise<void>;
  startSession: (title?: string) => Promise<void>;
  sendMessage: (sessionId: number, message: string) => Promise<void>;
  removeSession: (id: number) => Promise<void>;
  clearActiveSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSession: null,
  isLoading: false,
  isSending: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatApi.getChatSessions();
      // Handle both PaginatedResponse and ChatSession[]
      const sessions = Array.isArray(response) ? response : (response as any).results || [];
      set({ sessions, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch sessions', isLoading: false });
    }
  },

  fetchSession: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const session = await chatApi.getChatSession(id);
      set({ activeSession: session, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch session', isLoading: false });
    }
  },

  startSession: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await chatApi.createChatSession({ title });
      set((state) => ({
        sessions: [session, ...state.sessions],
        activeSession: session,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to start session', isLoading: false });
    }
  },

  sendMessage: async (sessionId: number, message: string) => {
    set({ isSending: true, error: null });

    // Add user message to local state immediately for better UI
    const tempUserMessage: ChatMessage = {
      id: Date.now(), // temporary id
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    set((state) => {
      const activeSession = state.activeSession;
      if (activeSession && activeSession.id === sessionId) {
        return {
          activeSession: {
            ...activeSession,
            messages: [...(activeSession.messages || []), tempUserMessage],
          },
        };
      }
      return {};
    });

    try {
      const aiResponse = await chatApi.sendChatMessage(sessionId, { message });

      set((state) => {
        const activeSession = state.activeSession;
        if (activeSession && activeSession.id === sessionId) {
          // Replace temp messages with actual ones from backend if possible,
          // or just append the AI response and let the next fetch clean it up if needed.
          // For simplicity, we just add the AI response.
          return {
            activeSession: {
              ...activeSession,
              messages: [...(activeSession.messages || []), aiResponse],
            },
            isSending: false,
          };
        }
        return { isSending: false };
      });

      // Refresh sessions to update titles/updated_at and the full message history
      try {
        await get().fetchSessions();
        await get().fetchSession(sessionId);
      } catch (err: any) {
        console.error('[ChatStore] Failed to refresh sessions after send:', err);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to send message', isSending: false });
    }
  },

  removeSession: async (id: number) => {
    try {
      await chatApi.deleteChatSession(id);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSession: state.activeSession?.id === id ? null : state.activeSession,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete session' });
    }
  },

  clearActiveSession: () => set({ activeSession: null, error: null }),
}));
