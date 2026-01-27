// Exercise Types
export interface Exercise {
    id: number;
    name: string;
    description?: string | null;
    instructions?: string | null;
    safety_tips?: string | null;
    image?: string | null; // URL string
    video_url?: string | null;
    is_active: boolean;
    primary_muscle: string;
    secondary_muscles?: string[] | null; // JSON array
    equipment_type: string;
    category: string;
    difficulty_level: string;
}

// Exercise Set Insights Types
export interface SetInsight {
    reason: string;
    current_reps?: number;
    optimal_range?: string;
    current_tut?: number;
    seconds_per_rep?: number;
    set_position?: number;
    total_sets?: number;
    optimal_sets?: string;
}

export interface ExerciseSetInsights {
    good: Record<string, SetInsight>;
    bad: Record<string, SetInsight>;
}

export interface WorkoutExercise {
    id: number;
    workout: number; // workout ID
    exercise: Exercise;
    order: number;
    sets: WorkoutExerciseSet[];
    one_rep_max?: number | null; // Calculated 1RM (only for completed workouts)
}

export interface WorkoutExerciseSet {
    id: number;
    workout_exercise: number; // workout_exercise ID (may not be needed in frontend)
    set_number: number;
    reps: number;
    weight: number; // DecimalField, comes as string or number
    reps_in_reserve: number;
    rest_time_before_set: number;
    is_warmup: boolean;
    eccentric_time?: number | null; // Time under tension - eccentric phase (seconds)
    concentric_time?: number | null; // Time under tension - concentric phase (seconds)
    total_tut?: number | null; // Total time under tension (seconds)
    insights?: ExerciseSetInsights | null;
}

export interface AddExerciseSetRequest {
    reps: number;
    weight: number; // DecimalField
    reps_in_reserve: number;
    rest_time_before_set: number; // seconds
    is_warmup: boolean;
    eccentric_time?: number | null; // seconds
    concentric_time?: number | null; // seconds
    total_tut?: number | null; // seconds
}

export interface UpdateExerciseSetRequest {
    reps?: number;
    weight?: number;
    reps_in_reserve?: number;
    rest_time_before_set?: number;
    is_warmup?: boolean;
    eccentric_time?: number | null;
    concentric_time?: number | null;
    total_tut?: number | null;
}

// Exercise 1RM History Types
export interface Exercise1RMHistoryEntry {
    workout_id: number;
    workout_title: string;
    workout_date: string; // ISO datetime string
    one_rep_max: number;
}

export interface Exercise1RMHistory {
    exercise_id: number;
    exercise_name: string;
    total_workouts: number;
    history: Exercise1RMHistoryEntry[];
}

// Exercise Ranking & Leaderboard Types
export interface ExerciseRanking {
    exercise_id: string;
    exercise_name: string;
    user_best_weight: number;
    user_best_one_rm: number;
    weight_percentile: number;
    one_rm_percentile: number;
    total_users: number;
    percentile_message: string;
}

export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string;
    value: number;
    is_current_user: boolean;
}

export interface ExerciseLeaderboard {
    exercise_id: string;
    exercise_name: string;
    stat_type: 'weight' | 'one_rm';
    leaderboard: LeaderboardEntry[];
    user_entry: LeaderboardEntry | null;
}
