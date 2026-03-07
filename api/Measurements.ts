import apiClient from './APIClient';
import type {
  BodyMeasurement,
  CreateBodyMeasurementRequest,
  BodyFatMenRequest,
  BodyFatWomenRequest,
  BodyFatResponse,
} from './types';
import {
  MEASUREMENTS_URL,
  MEASUREMENTS_CREATE_URL,
  MEASUREMENTS_BODYFAT_MEN_URL,
  MEASUREMENTS_BODYFAT_WOMEN_URL,
} from './types';
import { isPaginatedResponse, type PaginatedResponse } from './types/pagination';

export const createMeasurement = async (
  request: CreateBodyMeasurementRequest
): Promise<BodyMeasurement> => {
  return apiClient.post(MEASUREMENTS_CREATE_URL, { json: request }).json();
};

export const calculateBodyFatMen = async (
  request: BodyFatMenRequest
): Promise<BodyFatResponse> => {
  return apiClient.post(MEASUREMENTS_BODYFAT_MEN_URL, { json: request }).json();
};

export const calculateBodyFatWomen = async (
  request: BodyFatWomenRequest
): Promise<BodyFatResponse> => {
  return apiClient.post(MEASUREMENTS_BODYFAT_WOMEN_URL, { json: request }).json();
};

export const getMeasurements = async (
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<BodyMeasurement> | BodyMeasurement[]> => {
  const searchParams: Record<string, number> = {};
  if (page !== undefined) searchParams.page = page;
  if (pageSize !== undefined) searchParams.page_size = pageSize;

  const data = await apiClient.get(MEASUREMENTS_URL, { searchParams }).json();

  if (Array.isArray(data)) return data as BodyMeasurement[];
  if (isPaginatedResponse<BodyMeasurement>(data)) return data;
  const d = data as { results?: BodyMeasurement[]; next?: string | null; previous?: string | null };
  return {
    count: d.results?.length ?? 0,
    next: d.next ?? null,
    previous: d.previous ?? null,
    results: d.results ?? [],
  };
};
