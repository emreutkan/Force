// Rest Timer Types
export interface RestStatus {
    text: string;
    color: string;
    goal: number;
    max_goal: number;
}

export interface RestTimerState {
    last_set_timestamp: string | null; // ISO datetime string
    last_exercise_category: string | null; // "compound" | "isolation"
    elapsed_seconds: number;
    rest_status: RestStatus;
    is_paused: boolean;
}

export interface StopRestTimerResponse {
    message: string;
    last_set_timestamp: string | null;
    last_exercise_category: string | null;
    elapsed_seconds: number;
    rest_status: RestStatus;
    is_paused: boolean;
}

export interface ResumeRestTimerResponse {
    message: string;
    last_set_timestamp: string | null;
    last_exercise_category: string | null;
    elapsed_seconds: number;
    rest_status: RestStatus;
    is_paused: boolean;
}
