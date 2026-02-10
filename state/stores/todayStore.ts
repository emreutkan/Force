import { create } from 'zustand';

/**
 * Today store - manages client-side UI state for today's workout view
 * API calls have been moved to TanStack Query hooks in @/hooks/useWorkout
 *
 * Use useTodayStatus() from @/hooks/useWorkout for fetching today's status
 *
 * This store now only manages:
 * - UI-specific state for the today view
 * - Temporary flags and selections
 */
interface TodayStoreState {
  // UI state - whether user has manually refreshed today view
  lastManualRefresh: number | null;
  triggerManualRefresh: () => void;

  // Clear state
  clearState: () => void;
}

export const useTodayStore = create<TodayStoreState>((set) => ({
  lastManualRefresh: null,

  triggerManualRefresh: () => set({ lastManualRefresh: Date.now() }),

  clearState: () => set({ lastManualRefresh: null }),
}));
