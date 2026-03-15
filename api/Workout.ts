import apiClient from './APIClient';
import type {
  AddExerciseToWorkoutRequest,
  AvailableYearsResponse,
  CalendarResponse,
  CalendarStats,
  CheckTodayResponse,
  CreateTemplateWorkoutRequest,
  CreateWorkoutRequest,
  CreateWorkoutResponse,
  RecoveryStatusResponse,
  RestTimerStopResponse,
  StartTemplateWorkoutRequest,
  TemplateWorkout,
  UpdateWorkoutRequest,
  Workout,
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  CreateTemplateWorkoutResponse,
  StartTemplateWorkoutResponse,
  WorkoutSummaryResponse,
  UserStats,
  SuggestNextExerciseResponse,
  OptimizationCheckResponse,
  NextWorkoutCoachResponse,
  ActiveWorkoutCoachResponse,
  CoachReviewResponse,
} from './types/workout';
import {
  CREATE_WORKOUT_URL,
  GET_ACTIVE_WORKOUT_URL,
  GET_WORKOUT_URL,
  GET_WORKOUTS_URL,
  UPDATE_WORKOUT_URL,
  ADD_EXERCISE_TO_WORKOUT_URL,
  COMPLETE_WORKOUT_URL,
  DELETE_WORKOUT_URL,
  WORKOUT_SUMMARY_URL,
  TEMPLATE_CREATE_URL,
  TEMPLATE_LIST_URL,
  TEMPLATE_DELETE_URL,
  TEMPLATE_START_URL,
  REST_TIMER_URL,
  REST_TIMER_STOP_URL,
  REST_TIMER_RESUME_URL,
  CALENDAR_URL,
  AVAILABLE_YEARS_URL,
  CALENDAR_STATS_URL,
  CHECK_TODAY_URL,
  CHECK_DATE_URL,
  RECOVERY_STATUS_URL,
  RECOVERY_RECOMMENDATIONS_URL,
  FREQUENCY_RECOMMENDATIONS_URL,
  REST_RECOMMENDATIONS_URL,
  TRAINING_RESEARCH_URL,
  USER_STATS_URL,
  SUGGEST_EXERCISE_URL,
  OPTIMIZATION_CHECK_URL,
  NEXT_WORKOUT_COACH_URL,
  ACTIVE_WORKOUT_COACH_URL,
  WORKOUT_COACH_REVIEW_URL,
} from './types/';
import type { PaginatedResponse } from './types/pagination';
export const createWorkout = async (
  request: CreateWorkoutRequest
): Promise<CreateWorkoutResponse | any> => {
  const response = await apiClient.post(CREATE_WORKOUT_URL, { json: request });
  return response.json();
};

export const getActiveWorkout = async (): Promise<Workout | null> => {
  const response = await apiClient.get(GET_ACTIVE_WORKOUT_URL, { throwHttpErrors: false });
  if (response.status === 404) return null;
  const data = (await response.json()) as any;
  // API may return { active_workout: { ... } } wrapper — unwrap it
  if (data && data.active_workout) {
    return data.active_workout;
  }
  return data;
};

export const getWorkouts = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Workout>> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;
  const response = await apiClient.get(GET_WORKOUTS_URL, { searchParams });
  return response.json();
};

export const getWorkout = async (workoutId: number): Promise<Workout | null> => {
  const url = GET_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.get(url, { throwHttpErrors: false });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body?.error ?? 'Failed to load workout');
  }
  return response.json();
};

export const completeWorkout = async (
  workoutId: number,
  request: CompleteWorkoutRequest
): Promise<CompleteWorkoutResponse> => {
  const url = COMPLETE_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.post(url, { json: request });
  return response.json();
};

export const getWorkoutSummary = async (workoutId: number): Promise<WorkoutSummaryResponse> => {
  const url = WORKOUT_SUMMARY_URL.replace(':id', String(workoutId));
  const response = await apiClient.get(url);
  return response.json();
};

export const deleteWorkout = async (workoutId: number): Promise<void> => {
  const url = DELETE_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.delete(url, { throwHttpErrors: false });
  // 404 = workout already gone (e.g. deleted elsewhere); treat as success so cache invalidates and UI refreshes
  if (response.status === 404) return;
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body?.error ?? 'Failed to delete workout');
  }
};

// Template Workout API Functions
export const createTemplateWorkout = async (
  request: CreateTemplateWorkoutRequest
): Promise<CreateTemplateWorkoutResponse> => {
  const response = await apiClient.post(TEMPLATE_CREATE_URL, { json: request });
  return response.json();
};

export const getTemplateWorkouts = async (): Promise<PaginatedResponse<TemplateWorkout>> => {
  const response = await apiClient.get(TEMPLATE_LIST_URL);
  return response.json();
};

export const deleteTemplateWorkout = async (templateId: number): Promise<void> => {
  const url = TEMPLATE_DELETE_URL.replace(':id', String(templateId));
  await apiClient.delete(url);
};

export const startTemplateWorkout = async (
  request: StartTemplateWorkoutRequest
): Promise<StartTemplateWorkoutResponse> => {
  const response = await apiClient.post(TEMPLATE_START_URL, { json: request });

  return response.json();
};

// Edit Workout API Functions
export const updateWorkout = async (
  workoutId: number,
  request: UpdateWorkoutRequest
): Promise<Workout | any> => {
  const response = await apiClient.patch(UPDATE_WORKOUT_URL.replace(':id', workoutId.toString()), {
    json: request,
  });
  return response.json();
};

export const addExerciseToPastWorkout = async (
  workoutId: number,
  request: AddExerciseToWorkoutRequest
): Promise<Workout> => {
  const url = ADD_EXERCISE_TO_WORKOUT_URL.replace(':id', String(workoutId));
  const response = await apiClient.post(url, { json: request });
  return response.json();
};

export const getRestTimerState = async (): Promise<
  | {
      last_set_timestamp: string | null;
      last_exercise_category: string | null;
      elapsed_seconds?: number;
      rest_status?: any;
    }
  | any
> => {
  const response = await apiClient.get(REST_TIMER_URL);
  return response.json();
};

export const stopRestTimer = async (): Promise<RestTimerStopResponse> => {
  const response = await apiClient.get(REST_TIMER_STOP_URL);
  return response.json();
};

export const resumeRestTimer = async (): Promise<RestTimerStopResponse> => {
  const response = await apiClient.post(REST_TIMER_RESUME_URL);
  return response.json();
};

// Calendar API Functions
export const getCalendar = async (
  year: number,
  month?: number,
  week?: number
): Promise<CalendarResponse | any> => {
  const searchParams: Record<string, number> = { year };
  if (month !== undefined) searchParams.month = month;
  if (week !== undefined) searchParams.week = week;
  const response = await apiClient.get(CALENDAR_URL, { searchParams });
  return response.json();
};

export const getAvailableYears = async (): Promise<AvailableYearsResponse | any> => {
  const response = await apiClient.get(AVAILABLE_YEARS_URL);
  return response.json();
};

export const getCalendarStats = async (period: {
  year: number;
  month?: number | null;
  week?: number | null;
}): Promise<CalendarStats | any> => {
  const searchParams: Record<string, number> = { year: period.year };
  if (period.month != null) searchParams.month = period.month;
  if (period.week != null) searchParams.week = period.week;
  const response = await apiClient.get(CALENDAR_STATS_URL, { searchParams });
  return response.json();
};

export const checkToday = async (date?: Date): Promise<CheckTodayResponse | any> => {
  const searchParams: Record<string, string> = {};
  if (date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    searchParams.date = `${y}-${m}-${d}`;
  }
  const response = await apiClient.get(CHECK_TODAY_URL, {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
  });
  return response.json();
};

export const getRecoveryStatus = async (): Promise<RecoveryStatusResponse | any> => {
  const response = await apiClient.get(RECOVERY_STATUS_URL);
  return response.json();
};

export const getRecoveryRecommendations = async (): Promise<any> => {
  const response = await apiClient.get(RECOVERY_RECOMMENDATIONS_URL);
  return response.json();
};

export const getFrequencyRecommendations = async (): Promise<any> => {
  const response = await apiClient.get(FREQUENCY_RECOMMENDATIONS_URL);
  return response.json();
};

export const getRestRecommendations = async (workoutExerciseId: number): Promise<any> => {
  const url = REST_RECOMMENDATIONS_URL.replace(':workout_exercise_id', workoutExerciseId.toString());
  const response = await apiClient.get(url);
  return response.json();
};

export const getTrainingResearch = async (
  muscleGroup?: string,
  category?: string
): Promise<any> => {
  const searchParams: Record<string, string> = {};
  if (muscleGroup) searchParams.muscle_group = muscleGroup;
  if (category) searchParams.category = category;
  const response = await apiClient.get(TRAINING_RESEARCH_URL, {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
  });
  return response.json();
};

export const checkDate = async (date?: {
  date?: string;
  day?: number;
  month?: number;
  year?: number;
}): Promise<{ total_workouts: number; days_past: number; weeks_past: number }> => {
  const searchParams: Record<string, string | number> = {};
  if (date?.date) searchParams.date = date.date;
  if (date?.day !== undefined) searchParams.day = date.day;
  if (date?.month !== undefined) searchParams.month = date.month;
  if (date?.year !== undefined) searchParams.year = date.year;
  const response = await apiClient.get(CHECK_DATE_URL, {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
  });
  return response.json();
};

export const getUserStats = async (): Promise<UserStats> => {
  const response = await apiClient.get(USER_STATS_URL);
  return response.json();
};

export const getSuggestNextExercise = async (): Promise<SuggestNextExerciseResponse> => {
  const response = await apiClient.get(SUGGEST_EXERCISE_URL, { throwHttpErrors: false });
  if (!response.ok) return { suggestions: [], has_active_workout: false };
  return response.json();
};

export const getExerciseOptimizationCheck = async (
  workoutExerciseId: number
): Promise<OptimizationCheckResponse> => {
  const url = OPTIMIZATION_CHECK_URL.replace(':workout_exercise_id', workoutExerciseId.toString());
  const response = await apiClient.get(url);
  return response.json();
};

export const getNextWorkoutCoach = async (): Promise<NextWorkoutCoachResponse> => {
  const response = await apiClient.get(NEXT_WORKOUT_COACH_URL, { throwHttpErrors: false });
  if (!response.ok) throw new Error('Failed to load next workout coach');
  return response.json();
};

export const getActiveWorkoutCoach = async (): Promise<ActiveWorkoutCoachResponse | null> => {
  const response = await apiClient.get(ACTIVE_WORKOUT_COACH_URL, { throwHttpErrors: false });
  if (!response.ok) return null;
  return response.json();
};

export const getWorkoutCoachReview = async (workoutId: number): Promise<CoachReviewResponse> => {
  const url = WORKOUT_COACH_REVIEW_URL.replace(':id', String(workoutId));
  const response = await apiClient.get(url);
  return response.json();
};
