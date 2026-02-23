import { create } from 'zustand';
import type { ProgramDraftDay, ProgramDraftExercise } from '@/api/types/program';

// ─── State shape ─────────────────────────────────────────────────────────────

export interface ProgramStoreState {
  // Wizard data
  name: string;
  cycle_length: number;
  days: ProgramDraftDay[];

  // Actions
  setName: (name: string) => void;
  setCycleLength: (length: number) => void;

  /** Idempotent — reinitialises the days array when cycle_length changes. */
  initDays: () => void;

  setDayName: (dayNumber: number, name: string) => void;
  setDayRestDay: (dayNumber: number, isRest: boolean) => void;

  addExerciseToDay: (dayNumber: number, exercise: ProgramDraftExercise) => void;
  removeExerciseFromDay: (dayNumber: number, exerciseId: number) => void;
  updateExerciseSets: (dayNumber: number, exerciseId: number, targetSets: number) => void;
  moveExercise: (dayNumber: number, exerciseId: number, direction: 'up' | 'down') => void;

  /** Reset everything — call after successful creation or on cancel. */
  reset: () => void;
}

const DEFAULT_STATE = {
  name: '',
  cycle_length: 4,
  days: [] as ProgramDraftDay[],
};

const buildDays = (length: number): ProgramDraftDay[] =>
  Array.from({ length }, (_, i) => ({
    day_number: i + 1,
    name: '',
    is_rest_day: false,
    exercises: [],
  }));

// ─── Store ───────────────────────────────────────────────────────────────────

export const useProgramStore = create<ProgramStoreState>((set, get) => ({
  ...DEFAULT_STATE,

  setName: (name) => set({ name }),

  setCycleLength: (length) => set({ cycle_length: length }),

  initDays: () => {
    const { cycle_length, days } = get();
    // Preserve existing day data when growing/shrinking; only rebuild if length really changed
    if (days.length === cycle_length) return;
    const newDays = buildDays(cycle_length).map((blank, i) => ({
      ...blank,
      ...(days[i] ?? {}),
      // Keep the new day_number correct even if we trimmed
      day_number: i + 1,
      exercises: days[i]?.exercises ?? [],
    }));
    set({ days: newDays });
  },

  setDayName: (dayNumber, name) =>
    set((state) => ({
      days: state.days.map((d) => (d.day_number === dayNumber ? { ...d, name } : d)),
    })),

  setDayRestDay: (dayNumber, isRest) =>
    set((state) => ({
      days: state.days.map((d) =>
        d.day_number === dayNumber
          ? { ...d, is_rest_day: isRest, name: isRest ? 'Rest' : '', exercises: [] }
          : d
      ),
    })),

  addExerciseToDay: (dayNumber, exercise) =>
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        // Avoid duplicates
        if (d.exercises.some((e) => e.exercise_id === exercise.exercise_id)) return d;
        const withOrder: ProgramDraftExercise = {
          ...exercise,
          order: d.exercises.length + 1,
        };
        return { ...d, exercises: [...d.exercises, withOrder] };
      }),
    })),

  removeExerciseFromDay: (dayNumber, exerciseId) =>
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        const filtered = d.exercises
          .filter((e) => e.exercise_id !== exerciseId)
          .map((e, i) => ({ ...e, order: i + 1 }));
        return { ...d, exercises: filtered };
      }),
    })),

  updateExerciseSets: (dayNumber, exerciseId, targetSets) =>
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        return {
          ...d,
          exercises: d.exercises.map((e) =>
            e.exercise_id === exerciseId ? { ...e, target_sets: targetSets } : e
          ),
        };
      }),
    })),

  moveExercise: (dayNumber, exerciseId, direction) =>
    set((state) => ({
      days: state.days.map((d) => {
        if (d.day_number !== dayNumber) return d;
        const list = [...d.exercises];
        const idx = list.findIndex((e) => e.exercise_id === exerciseId);
        if (idx === -1) return d;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= list.length) return d;
        [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
        const reordered = list.map((e, i) => ({ ...e, order: i + 1 }));
        return { ...d, exercises: reordered };
      }),
    })),

  reset: () => set({ ...DEFAULT_STATE, days: [] }),
}));
