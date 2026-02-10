import { create } from 'zustand';

/**
 * Home loading store - manages client-side UI state for the home screen
 * Data caching has been moved to TanStack Query hooks
 *
 * Use useTodayStatus() and useRecoveryStatus() from @/hooks/useWorkout for data fetching
 *
 * This store now only manages:
 * - UI-specific loading/display states
 * - User preferences for home screen
 */
export interface HomeLoadingState {
  // UI state - whether user has completed the initial onboarding tour
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (seen: boolean) => void;

  // UI state - selected tab/view on home screen (if applicable)
  selectedView: 'summary' | 'recovery' | 'stats';
  setSelectedView: (view: HomeLoadingState['selectedView']) => void;

  // Clear state
  clearState: () => void;
}

export const useHomeLoadingStore = create<HomeLoadingState>((set) => ({
  hasSeenOnboarding: false,
  selectedView: 'summary',

  setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),

  setSelectedView: (view) => set({ selectedView: view }),

  clearState: () =>
    set({
      hasSeenOnboarding: false,
      selectedView: 'summary',
    }),
}));

export default useHomeLoadingStore;
