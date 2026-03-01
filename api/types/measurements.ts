// Body Measurements Types
export type BodyMeasurement = {
  id: number;
  height: number | string;
  weight: number | string;
  waist: number | string;
  neck: number | string;
  hips: number | string | null;
  body_fat_percentage: number | string | null;
  gender: 'male' | 'female';
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

// Body Measurement Request
export type CreateBodyMeasurementRequest = {
  height: number;
  weight: number;
  waist: number;
  neck: number;
  hips?: number;
  gender: 'male' | 'female';
  notes?: string;
};

// Body Fat Calculation
export type BodyFatMenRequest = {
  height: number;
  weight: number;
  waist: number;
  neck: number;
};

export type BodyFatWomenRequest = BodyFatMenRequest & {
  hips: number;
};

export type BodyFatResponse = {
  body_fat_percentage: number;
  measurements: Record<string, number>;
  method: string;
};

// Weight History Types
export type WeightHistoryEntry = {
  id: number;
  date: string;
  weight: number;
  bodyfat: number | null;
};

export type WeightHistoryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: WeightHistoryEntry[];
};
