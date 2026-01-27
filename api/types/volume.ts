// Volume Analysis Types
export interface MuscleGroupData {
    total_volume: number;
    sets: number;
    workouts: number;
}

export interface WeeklyVolumeData {
    week_start: string; // YYYY-MM-DD
    week_end: string; // YYYY-MM-DD
    muscle_groups: Record<string, MuscleGroupData>;
}

export interface VolumePeriod {
    start_date: string;
    end_date: string;
    total_weeks: number;
}

export interface VolumeAnalysisResponse {
    period: VolumePeriod;
    weeks: WeeklyVolumeData[];
    is_pro: boolean;
    weeks_limit?: number; // Only present for FREE users (default: 4)
}

export interface VolumeAnalysisFilters {
    weeks_back?: number;
    start_date?: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
}
