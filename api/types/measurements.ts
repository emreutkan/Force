// Body Measurements Types
export interface BodyMeasurement {
    id: number;
    height: number | string;  // cm
    weight: number | string;  // kg
    waist: number | string;   // cm
    neck: number | string;    // cm
    hips: number | string | null;  // cm (required for women)
    body_fat_percentage: number | string | null;  // Auto-calculated
    gender: "male" | "female";
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateMeasurementRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips?: number;  // Required for women
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
    notes?: string;
}

export interface CalculateBodyFatMenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatWomenRequest {
    height: number;
    weight: number;
    waist: number;
    neck: number;
    hips: number;
    gender?: "male" | "female";  // Optional - uses user's gender from database if not provided
}

export interface CalculateBodyFatResponse {
    body_fat_percentage: number;
    measurements: {
        height_cm: number;
        weight_kg: number;
        waist_cm: number;
        neck_cm: number;
        hips_cm?: number;  // Only for women
    };
    gender_used: "male" | "female";
    method: string;
}

// Weight History Types
export interface WeightHistoryEntry {
    id: number;
    date: string;
    weight: number;
    bodyfat: number | null;
}

export interface WeightHistoryResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: WeightHistoryEntry[];
}
