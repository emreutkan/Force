import { create } from 'zustand';

/**
 * Workout store - manages client-side workout UI state only
 * API calls have been moved to TanStack Query hooks in @/hooks/useWorkout
 *
 * This store now only manages:
 * - UI-specific state (filters, selections, etc.)
 * - Temporary client state that doesn't belong in React Query cache
 */
export interface WorkoutState {
  // UI state - selected workout for viewing/editing
  selectedWorkoutId: number | null;
  setSelectedWorkoutId: (id: number | null) => void;

  // Filter state for workout list (if needed in the future)
  filters: {
    year?: number;
    month?: number;
  };
  setFilters: (filters: Partial<WorkoutState['filters']>) => void;
  clearFilters: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  selectedWorkoutId: null,
  filters: {},

  setSelectedWorkoutId: (id) => set({ selectedWorkoutId: id }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () => set({ filters: {} }),
}));

export default useWorkoutStore;
