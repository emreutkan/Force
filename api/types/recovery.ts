// Muscle Recovery Types
export interface MuscleRecovery {
    id: number | null;
    muscle_group: string;
    fatigue_score: number | string; // Can be number or string from API
    total_sets: number;
    recovery_hours: number;
    recovery_until: string | null;
    is_recovered: boolean;
    hours_until_recovery: number;
    recovery_percentage: number;
    source_workout: number | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CNSRecovery {
    id: number | null;
    cns_load: number;
    recovery_hours: number;
    recovery_until: string | null;
    is_recovered: boolean;
    source_workout: number | null;
    hours_until_recovery: number;
    recovery_percentage: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface RecoveryStatusResponse {
    recovery_status: Record<string, MuscleRecovery>;
    cns_recovery: CNSRecovery | null; // null for FREE users
    is_pro: boolean;
    timestamp: string;
}

// Recovery Recommendations Types
export interface RecoveryRecommendation {
    title: string;
    summary: string;
    category: string;
    confidence_score: number;
    parameters: Record<string, any>;
    source_url?: string | null;
}

export interface RecoveryRecommendationsResponse {
    last_workout_id: number;
    last_workout_date: string; // ISO datetime string
    hours_since_workout: number;
    muscle_groups_worked: string[];
    recommended_recovery_hours: number;
    is_recovered: boolean;
    recommendations: RecoveryRecommendation[];
}

// Rest Period Recommendations Types
export interface RestPeriodRecommendationsResponse {
    exercise_id: number;
    exercise_name: string;
    exercise_type: string; // "compound" | "isolation"
    recommended_rest_seconds: {
        min: number;
        max: number;
        optimal: number;
    };
    research_source?: string | null;
}

// Training Frequency Recommendations Types
export interface TrainingFrequencyRecommendationsResponse {
    optimal_frequency_per_week: {
        min: number;
        max: number;
    };
    max_days_between_sessions: number;
    protein_synthesis_window_hours: number;
    research_title?: string | null;
    research_summary?: string | null;
    source_url?: string | null;
}
