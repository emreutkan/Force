import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAchievements,
  getEarnedAchievements,
  getAchievementCategories,
  getUnnotifiedAchievements,
  markAchievementsSeen,
  getPersonalRecords,
  getExercisePR,
  getUserStatistics,
  forceRecalculateStats,
  getExerciseRanking,
  getAllRankings,
  getLeaderboard,
} from '@/api/Achievements';

// Achievements queries
export const useAchievements = (category?: string, page?: number, pageSize?: number) => {
  return useQuery({
    queryKey: ['achievements', category, page, pageSize],
    queryFn: () => getAchievements(category, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useEarnedAchievements = () => {
  return useQuery({
    queryKey: ['earned-achievements'],
    queryFn: getEarnedAchievements,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAchievementCategories = () => {
  return useQuery({
    queryKey: ['achievement-categories'],
    queryFn: getAchievementCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes - categories rarely change
  });
};

export const useUnnotifiedAchievements = () => {
  return useQuery({
    queryKey: ['unnotified-achievements'],
    queryFn: getUnnotifiedAchievements,
    staleTime: 1000 * 30, // 30 seconds - check frequently for new achievements
  });
};

// Mark achievements as seen mutation
export const useMarkAchievementsSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (achievementIds?: string[]) => markAchievementsSeen(achievementIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unnotified-achievements'] });
    },
  });
};

// Personal records queries
export const usePersonalRecords = () => {
  return useQuery({
    queryKey: ['personal-records'],
    queryFn: getPersonalRecords,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useExercisePR = (exerciseId: string | number | null) => {
  return useQuery({
    queryKey: ['exercise-pr', exerciseId],
    queryFn: () => getExercisePR(exerciseId!),
    enabled: exerciseId !== null,
    staleTime: 1000 * 60 * 5,
  });
};

// Statistics queries
export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['user-statistics'],
    queryFn: getUserStatistics,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useForceRecalculateStats = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceRecalculateStats,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['unnotified-achievements'] });
    },
  });
};

// Ranking and leaderboard queries
export const useExerciseRanking = (exerciseId: string | number | null) => {
  return useQuery({
    queryKey: ['exercise-ranking', exerciseId],
    queryFn: () => getExerciseRanking(exerciseId!),
    enabled: exerciseId !== null,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAllRankings = () => {
  return useQuery({
    queryKey: ['all-rankings'],
    queryFn: getAllRankings,
    staleTime: 1000 * 60 * 5,
  });
};

export const useLeaderboard = (
  exerciseId: string | number | null,
  limit: number = 10,
  stat: 'weight' | 'one_rm' = 'one_rm'
) => {
  return useQuery({
    queryKey: ['leaderboard', exerciseId, limit, stat],
    queryFn: () => getLeaderboard(exerciseId!, limit, stat),
    enabled: exerciseId !== null,
    staleTime: 1000 * 60 * 5,
  });
};

// Utility hooks
export const useInvalidateAchievements = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    queryClient.invalidateQueries({ queryKey: ['earned-achievements'] });
    queryClient.invalidateQueries({ queryKey: ['unnotified-achievements'] });
  };
};
