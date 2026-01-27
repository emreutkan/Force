// Workout Summary Types
export interface WorkoutSummaryInsight {
    type: "recovery" | "1rm";
    message: string;
    pre_recovery?: number; // For recovery type
    current_1rm?: number; // For 1rm type
    previous_1rm?: number | null; // For 1rm type
    difference?: number | null; // For 1rm type
    percent_change?: number | null; // For 1rm type
}

export interface WorkoutSummaryResponse {
    workout_id: number;
    score: number; // 0-10
    positives: Record<string, WorkoutSummaryInsight>;
    negatives: Record<string, WorkoutSummaryInsight>;
    neutrals: Record<string, WorkoutSummaryInsight>;
    summary: {
        total_positives: number;
        total_negatives: number;
        total_neutrals: number;
        muscles_worked: string[];
        exercises_performed: number;
    };
    is_pro: boolean;
    has_advanced_insights: boolean; // true for PRO users (includes 1RM analysis)
}
