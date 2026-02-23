import { create } from 'zustand';

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
