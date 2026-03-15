import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProgram,
  listPrograms,
  getProgram,
  renameProgram,
  deleteProgram,
  activateProgram,
  deactivateProgram,
  getCurrentProgramDay,
  startTodayWorkout,
} from '@/api/WorkoutProgram';
import type { CreateWorkoutProgramRequest, RenameProgramRequest } from '@/api/types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const PROGRAMS_KEY = ['programs'] as const;
export const programKey = (id: number) => ['program', id] as const;
export const CURRENT_PROGRAM_DAY_KEY = ['program-current-day'] as const;

// ─── Queries ─────────────────────────────────────────────────────────────────

export const usePrograms = () =>
  useQuery({
    queryKey: PROGRAMS_KEY,
    queryFn: listPrograms,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const useCurrentProgramDay = () =>
  useQuery({
    queryKey: CURRENT_PROGRAM_DAY_KEY,
    queryFn: getCurrentProgramDay,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export const useProgram = (id: number | null) =>
  useQuery({
    queryKey: programKey(id!),
    queryFn: () => getProgram(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 5,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateWorkoutProgramRequest) => createProgram(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
    },
  });
};

export const useRenameProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: RenameProgramRequest }) =>
      renameProgram(id, request),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
      queryClient.setQueryData(programKey(updated.id), updated);
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProgram(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
      queryClient.removeQueries({ queryKey: programKey(id) });
    },
  });
};

export const useActivateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activateProgram(id),
    onSuccess: (updated) => {
      // Invalidate the full list (active flags changed on other programs too)
      queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
      queryClient.setQueryData(programKey(updated.id), updated);
    },
  });
};

export const useDeactivateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateProgram(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
      queryClient.setQueryData(programKey(updated.id), updated);
    },
  });
};

export const useStartTodayWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startTodayWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-status'] });
    },
  });
};
