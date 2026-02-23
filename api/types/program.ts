import type { Exercise } from './exercise';

// ─── Read models ────────────────────────────────────────────────────────────

export interface WorkoutProgramExercise {
  id: number;
  exercise: Exercise;
  order: number;
  target_sets: number;
}

export interface WorkoutProgramDay {
  id: number;
  day_number: number;
  name: string;
  is_rest_day: boolean;
  exercises: WorkoutProgramExercise[];
}

export interface WorkoutProgram {
  id: number;
  name: string;
  cycle_length: number;
  is_active: boolean;
  days: WorkoutProgramDay[];
  created_at: string;
  updated_at: string;
}

// ─── Write models ───────────────────────────────────────────────────────────

export interface CreateProgramExercisePayload {
  exercise_id: number;
  target_sets: number;
  order: number;
}

export interface CreateProgramDayPayload {
  day_number: number;
  name: string;
  is_rest_day: boolean;
  exercises: CreateProgramExercisePayload[];
}

export interface CreateWorkoutProgramRequest {
  name: string;
  cycle_length: number;
  days: CreateProgramDayPayload[];
}

export interface RenameProgramRequest {
  name: string;
}

// ─── Current program day response ───────────────────────────────────────────

export interface CurrentProgramDay {
  program_id: number;
  program_name: string;
  cycle_length: number;
  activated_at: string;
  days_completed_since_activation: number;
  current_day_number: number;
  current_day: WorkoutProgramDay;
}

// ─── Draft / local-state model (used in the create wizard) ──────────────────

export interface ProgramDraftExercise {
  exercise_id: number;
  exercise_name: string; // display only
  target_sets: number;
  order: number;
}

export interface ProgramDraftDay {
  day_number: number;
  name: string;
  is_rest_day: boolean;
  exercises: ProgramDraftExercise[];
}

export interface ProgramDraftState {
  name: string;
  cycle_length: number;
  days: ProgramDraftDay[];
}
