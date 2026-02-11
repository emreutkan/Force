import apiClient from './APIClient';
import {
  UserAchievement,
  AchievementCategoryStats,
  UnnotifiedAchievement,
  PersonalRecord,
  ACHIEVEMENTS_URL,
  EARNED_ACHIEVEMENTS_URL,
  ACHIEVEMENT_CATEGORIES_URL,
  UNNOTIFIED_ACHIEVEMENTS_URL,
  MARK_ACHIEVEMENTS_SEEN_URL,
  PERSONAL_RECORDS_URL,
  EXERCISE_PR_URL,
  USER_STATISTICS_URL,
  RECALCULATE_STATS_URL,
  RANKING_URL,
  RANKINGS_URL,
  LEADERBOARD_URL,
} from './types/achievements';
import { PaginatedResponse } from './types/pagination';
import { UserStatistics } from './types/account';
import { ExerciseRanking, ExerciseLeaderboard } from './types/exercise';

export const getAchievements = async (
  category?: string,
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<UserAchievement> | UserAchievement[]> => {
  const params: any = {};
  if (category) params.category = category;
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;

  const response = await apiClient.get(ACHIEVEMENTS_URL, { params });
  return response.data;
};

export const getEarnedAchievements = async (): Promise<UserAchievement[]> => {
  const response = await apiClient.get(EARNED_ACHIEVEMENTS_URL);
  return response.data;
};

export const getAchievementCategories = async (): Promise<AchievementCategoryStats[]> => {
  const response = await apiClient.get(ACHIEVEMENT_CATEGORIES_URL);
  return response.data;
};

export const getUnnotifiedAchievements = async (): Promise<UnnotifiedAchievement[]> => {
  const response = await apiClient.get(UNNOTIFIED_ACHIEVEMENTS_URL);
  return response.data;
};

export const markAchievementsSeen = async (achievementIds?: string[]): Promise<void> => {
  await apiClient.post(MARK_ACHIEVEMENTS_SEEN_URL, {
    achievement_ids: achievementIds,
  });
};

export const getPersonalRecords = async (): Promise<any[]> => {
  const response = await apiClient.get(PERSONAL_RECORDS_URL);
  return response.data;
};

export const getExercisePR = async (
  exerciseId: string | number
): Promise<PersonalRecord | null> => {
  const response = await apiClient.get(`${EXERCISE_PR_URL}${exerciseId}/`);
  return response.data;
};

export const getUserStatistics = async (): Promise<UserStatistics | null> => {
  const response = await apiClient.get(USER_STATISTICS_URL);
  return response.data;
};

export const forceRecalculateStats = async (): Promise<{
  status: string;
  new_achievements: number;
  stats: UserStatistics;
} | null> => {
  const response = await apiClient.post(RECALCULATE_STATS_URL);
  return response.data;
};

export const getExerciseRanking = async (
  exerciseId: string | number
): Promise<ExerciseRanking | null> => {
  const response = await apiClient.get(`${RANKING_URL}${exerciseId}/`);
  return response.data;
};

export const getAllRankings = async (): Promise<ExerciseRanking[]> => {
  const response = await apiClient.get(RANKINGS_URL);
  return response.data;
};

export const getLeaderboard = async (
  exerciseId: string | number,
  limit: number = 10,
  stat: 'weight' | 'one_rm' = 'one_rm'
): Promise<ExerciseLeaderboard | null> => {
  const response = await apiClient.get(`${LEADERBOARD_URL}${exerciseId}/`, {
    params: { limit, stat },
  });
  return response.data;
};
