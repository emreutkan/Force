// Achievements & Personal Records Types
export type AchievementCategory =
  | 'workout_count'
  | 'workout_streak'
  | 'pr_weight'
  | 'pr_one_rep_max'
  | 'total_volume'
  | 'exercise_count'
  | 'muscle_volume'
  | 'consistency';

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  category_display: string;
  rarity: AchievementRarity;
  rarity_display: string;
  requirement_value: number;
  exercise: string | null;
  exercise_name: string | null;
  muscle_group: string | null;
  points: number;
  is_hidden: boolean;
  order: number;
}

export interface UserAchievement {
  achievement: Achievement;
  is_earned: boolean;
  current_progress: number;
  progress_percentage: number;
  earned_at: string | null;
  earned_value: number | null;
}

export interface AchievementCategoryStats {
  code: AchievementCategory;
  name: string;
  total: number;
  earned: number;
  progress_percentage: number;
}

export interface UnnotifiedAchievement extends UserAchievement {
  message: string;
}

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  best_weight: number;
  best_weight_reps: number;
  best_weight_date: string | null;
  best_one_rep_max: number;
  best_one_rep_max_weight: number;
  best_one_rep_max_reps: number;
  best_one_rep_max_date: string | null;
  best_set_volume: number;
  best_set_volume_date: string | null;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  created_at: string;
  updated_at: string;
}
