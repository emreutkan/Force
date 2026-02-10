import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  createWorkout,
  getActiveWorkout,
  getWorkouts,
  getWorkout,
  completeWorkout,
  getWorkoutSummary,
  deleteWorkout,
  createTemplateWorkout,
  getTemplateWorkouts,
  deleteTemplateWorkout,
  startTemplateWorkout,
  updateWorkout,
  addExerciseToPastWorkout,
  getRestTimerState,
  stopRestTimer,
  getCalendar,
  getAvailableYears,
  getCalendarStats,
  checkToday,
  getRecoveryStatus,
} from '@/api/Workout';
import type {
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  AddExerciseToWorkoutRequest,
  CreateTemplateWorkoutRequest,
  StartTemplateWorkoutRequest,
} from '@/api/types';

// Workouts list with pagination
export const useWorkouts = (page: number = 1, pageSize?: number) => {
  return useQuery({
    queryKey: ['workouts', page, pageSize],
    queryFn: () => getWorkouts(page, pageSize),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Infinite scroll for workouts
export const useInfiniteWorkouts = (pageSize: number = 10) => {
  return useInfiniteQuery({
    queryKey: ['workouts-infinite'],
    queryFn: ({ pageParam = 1 }) => getWorkouts(pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      if (lastPage?.next) {
        const url = new URL(lastPage.next);
        const page = url.searchParams.get('page');
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
  });
};

// Single workout query
export const useWorkout = (workoutId: number | null) => {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => getWorkout(workoutId!),
    enabled: workoutId !== null,
    staleTime: 1000 * 60 * 2,
  });
};

// Active workout query
export const useActiveWorkout = () => {
  return useQuery({
    queryKey: ['active-workout'],
    queryFn: getActiveWorkout,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Create workout mutation
export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateWorkoutRequest) => createWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};

// Complete workout mutation
export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      data,
    }: {
      workoutId: number;
      data?: { duration?: string; intensity?: number; notes?: string };
    }) => completeWorkout(workoutId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Workout summary query
export const useWorkoutSummary = (workoutId: number | null) => {
  return useQuery({
    queryKey: ['workout-summary', workoutId],
    queryFn: () => getWorkoutSummary(workoutId!),
    enabled: workoutId !== null,
  });
};

// Delete workout mutation
export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: number) => deleteWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};

// Template workouts
export const useTemplateWorkouts = () => {
  return useQuery({
    queryKey: ['template-workouts'],
    queryFn: getTemplateWorkouts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create template workout mutation
export const useCreateTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTemplateWorkoutRequest) => createTemplateWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-workouts'] });
    },
  });
};

// Delete template workout mutation
export const useDeleteTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => deleteTemplateWorkout(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-workouts'] });
    },
  });
};

// Start template workout mutation
export const useStartTemplateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: StartTemplateWorkoutRequest) => startTemplateWorkout(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['active-workout'] });
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};

// Update workout mutation
export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, request }: { workoutId: number; request: UpdateWorkoutRequest }) =>
      updateWorkout(workoutId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
    },
  });
};

// Add exercise to past workout mutation
export const useAddExerciseToPastWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, request }: { workoutId: number; request: AddExerciseToWorkoutRequest }) =>
      addExerciseToPastWorkout(workoutId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
    },
  });
};

// Rest timer state query
export const useRestTimerState = () => {
  return useQuery({
    queryKey: ['rest-timer-state'],
    queryFn: getRestTimerState,
    staleTime: 1000 * 5, // 5 seconds
  });
};

// Stop rest timer mutation
export const useStopRestTimer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stopRestTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rest-timer-state'] });
    },
  });
};

// Calendar queries
export const useCalendar = (year: number, month?: number, week?: number) => {
  return useQuery({
    queryKey: ['calendar', year, month, week],
    queryFn: () => getCalendar(year, month, week),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAvailableYears = () => {
  return useQuery({
    queryKey: ['available-years'],
    queryFn: getAvailableYears,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCalendarStats = (year: number, month?: number, week?: number) => {
  return useQuery({
    queryKey: ['calendar-stats', year, month, week],
    queryFn: () => getCalendarStats(year, month, week),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Today status query
export const useTodayStatus = () => {
  return useQuery({
    queryKey: ['today-status'],
    queryFn: checkToday,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Recovery status query
export const useRecoveryStatus = () => {
  return useQuery({
    queryKey: ['recovery-status'],
    queryFn: getRecoveryStatus,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Utility hooks
export const useInvalidateWorkouts = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['workouts'] });
    queryClient.invalidateQueries({ queryKey: ['workouts-infinite'] });
  };
};

export const useInvalidateTodayStatus = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['today-status'] });
};
