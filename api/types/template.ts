// Template Workout Types
import type { Exercise } from './exercise';

export interface CreateTemplateWorkoutRequest {
    title: string;
    exercises: number[]; // Array of exercise IDs
    notes?: string;
}

export interface TemplateWorkoutExercise {
    id: number;
    exercise: Exercise; // Full exercise object
    order: number;
}

export interface TemplateWorkout {
    id: number;
    title: string;
    exercises: TemplateWorkoutExercise[];
    primary_muscle_groups: string[];
    secondary_muscle_groups: string[];
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface StartTemplateWorkoutRequest {
    template_workout_id: number;
}
