import { create } from 'zustand';

/**
 * Supplement store - manages client-side supplement UI state only
 * API calls have been moved to TanStack Query hooks in @/hooks/useSupplements
 *
 * This store now only manages:
 * - UI-specific state (selected supplement, viewing logs modal, etc.)
 * - Temporary client state that doesn't belong in React Query cache
 */
export interface SupplementState {
  // UI state - which supplement's logs are being viewed
  viewingLogsForSupplementId: number | null;
  setViewingLogsForSupplementId: (id: number | null) => void;

  // UI state - selected supplement for editing/actions
  selectedSupplementId: number | null;
  setSelectedSupplementId: (id: number | null) => void;

  // Filter state (if needed)
  filters: {
    showInactiveOnly?: boolean;
  };
  setFilters: (filters: Partial<SupplementState['filters']>) => void;
  clearFilters: () => void;

  // Clear all UI state
  clearState: () => void;
}

export const useSupplementStore = create<SupplementState>((set) => ({
  viewingLogsForSupplementId: null,
  selectedSupplementId: null,
  filters: {},

  setViewingLogsForSupplementId: (id) => set({ viewingLogsForSupplementId: id }),

  setSelectedSupplementId: (id) => set({ selectedSupplementId: id }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () => set({ filters: {} }),

  clearState: () =>
    set({
      viewingLogsForSupplementId: null,
      selectedSupplementId: null,
      filters: {},
    }),
}));

export default useSupplementStore;
