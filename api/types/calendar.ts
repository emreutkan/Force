// Calendar Types
export interface CalendarDay {
    date: string; // ISO date string "2025-12-18"
    day: number; // Day of month (1-31)
    weekday: number; // Day of week (0=Sunday, 6=Saturday)
    has_workout: boolean;
    is_rest_day: boolean;
    workout_count: number;
    rest_day_count: number;
}

export interface CalendarPeriod {
    year: number;
    month: number | null;
    week: number | null;
    start_date: string; // ISO date string
    end_date: string; // ISO date string
}

export interface CalendarResponse {
    calendar: CalendarDay[];
    period: CalendarPeriod;
}

export interface CalendarStats {
    total_workouts: number;
    total_rest_days: number;
    days_not_worked: number;
    total_days: number;
    period: CalendarPeriod;
}

export interface AvailableYearsResponse {
    years: number[];
}

// Check Today Response Types
import type { Workout } from './workout';

export type CheckTodayResponse =
    | { workout_performed: false; active_workout: true } // Active Workout Exists
    | { workout_performed: false; date: string; message: string } // No Workout Today
    | { workout_performed: true; is_rest: true } // Rest Day Today
    | { workout_performed: true; is_rest_day: false; date: string; workout: Workout; message: string }; // Regular Workout Performed Today
