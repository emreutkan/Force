import apiClient from './APIClient';
import type {
  WorkoutProgram,
  CreateWorkoutProgramRequest,
  RenameProgramRequest,
} from './types/program';
import {
  PROGRAM_CREATE_URL,
  PROGRAM_LIST_URL,
  PROGRAM_DETAIL_URL,
  PROGRAM_UPDATE_URL,
  PROGRAM_DELETE_URL,
  PROGRAM_ACTIVATE_URL,
  PROGRAM_DEACTIVATE_URL,
  PROGRAM_CURRENT_DAY_URL,
  PROGRAM_START_TODAY_URL,
} from './types/';
import type { CurrentProgramDay } from './types/program';
import type { Workout } from './types/workout';

// ─── Helpers ────────────────────────────────────────────────────────────────

const idUrl = (template: string, id: number) => template.replace(':id', String(id));

// ─── API functions ───────────────────────────────────────────────────────────

export const createProgram = async (
  request: CreateWorkoutProgramRequest
): Promise<WorkoutProgram> => {
  const response = await apiClient.post(PROGRAM_CREATE_URL, { json: request });
  return response.json();
};

export const listPrograms = async (): Promise<WorkoutProgram[]> => {
  const response = await apiClient.get(PROGRAM_LIST_URL);
  const data = (await response.json()) as WorkoutProgram[] | { results: WorkoutProgram[] };
  // Handle both plain array and paginated responses
  if (Array.isArray(data)) return data;
  return (data as { results: WorkoutProgram[] }).results ?? [];
};

export const getProgram = async (id: number): Promise<WorkoutProgram | null> => {
  const response = await apiClient.get(idUrl(PROGRAM_DETAIL_URL, id), {
    throwHttpErrors: false,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body?.detail ?? 'Failed to load program');
  }
  return response.json();
};

export const renameProgram = async (
  id: number,
  request: RenameProgramRequest
): Promise<WorkoutProgram> => {
  const response = await apiClient.patch(idUrl(PROGRAM_UPDATE_URL, id), { json: request });
  return response.json();
};

export const deleteProgram = async (id: number): Promise<void> => {
  const response = await apiClient.delete(idUrl(PROGRAM_DELETE_URL, id), {
    throwHttpErrors: false,
  });
  if (response.status === 404) return; // Already gone — treat as success
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body?.detail ?? 'Failed to delete program');
  }
};

export const activateProgram = async (id: number): Promise<WorkoutProgram> => {
  const response = await apiClient.post(idUrl(PROGRAM_ACTIVATE_URL, id));
  return response.json();
};

export const deactivateProgram = async (id: number): Promise<WorkoutProgram> => {
  const response = await apiClient.post(idUrl(PROGRAM_DEACTIVATE_URL, id));
  return response.json();
};

export const getCurrentProgramDay = async (): Promise<CurrentProgramDay | null> => {
  const response = await apiClient.get(PROGRAM_CURRENT_DAY_URL, { throwHttpErrors: false });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to load current program day');
  return response.json();
};

export type StartTodayError =
  | { code: 'NO_ACTIVE_PROGRAM' }
  | { code: 'ACTIVE_WORKOUT_EXISTS'; activeWorkoutId: number }
  | { code: 'UNKNOWN'; message: string };

export const startTodayWorkout = async (): Promise<Workout> => {
  const response = await apiClient.post(PROGRAM_START_TODAY_URL, { throwHttpErrors: false });
  if (response.status === 201) return response.json();

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    active_workout?: number;
    message?: string;
  };

  if (body.error === 'ACTIVE_WORKOUT_EXISTS') {
    const err = new Error('ACTIVE_WORKOUT_EXISTS') as Error & { startTodayError: StartTodayError };
    err.startTodayError = { code: 'ACTIVE_WORKOUT_EXISTS', activeWorkoutId: body.active_workout! };
    throw err;
  }
  if (body.error === 'NO_ACTIVE_PROGRAM') {
    const err = new Error('NO_ACTIVE_PROGRAM') as Error & { startTodayError: StartTodayError };
    err.startTodayError = { code: 'NO_ACTIVE_PROGRAM' };
    throw err;
  }
  const err = new Error(body.message ?? 'Failed to start today\'s workout') as Error & {
    startTodayError: StartTodayError;
  };
  err.startTodayError = { code: 'UNKNOWN', message: body.message ?? 'Unknown error' };
  throw err;
};
