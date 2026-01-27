// Supplements Types
export interface Supplement {
    id: number;
    name: string;
    description?: string | null;
    dosage_unit: "mg" | "g" | "mcg" | "IU" | "ml" | "tablet" | "capsule" | "scoop" | "other";
    default_dosage?: number | null;
    bioavailability_score?: string | null;
}

export interface UserSupplement {
    id: number;
    supplement_id: number; // For write operations
    supplement_details: Supplement; // For read operations
    dosage: number;
    frequency: "daily" | "weekly" | "custom";
    time_of_day?: string | null;
    is_active: boolean;
}

export interface UserSupplementLog {
    id: number;
    user_supplement_id: number; // For write operations
    user_supplement?: UserSupplement; // For read operations
    date: string; // ISO date string
    time: string; // ISO time string
    dosage: number;
}

export interface UserSupplementLogTodayResponse {
    date: string; // ISO date string
    logs: UserSupplementLog[];
    count: number;
}
