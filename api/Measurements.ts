import apiClient from './APIClient';
import { BodyMeasurement, CalculateBodyFatMenRequest, CalculateBodyFatResponse, CalculateBodyFatWomenRequest, CreateMeasurementRequest } from './types';

export const createMeasurement = async (request: CreateMeasurementRequest): Promise<BodyMeasurement | any> => {
    try {
        const response = await apiClient.post('/measurements/create/', request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
};

export const getMeasurements = async (): Promise<BodyMeasurement[] | any> => {
    try {
        const response = await apiClient.get('/measurements/');
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
};

export const calculateBodyFatMen = async (request: CalculateBodyFatMenRequest): Promise<CalculateBodyFatResponse | any> => {
    try {
        const response = await apiClient.post('/measurements/calculate-body-fat/men/', request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
};

export const calculateBodyFatWomen = async (request: CalculateBodyFatWomenRequest): Promise<CalculateBodyFatResponse | any> => {
    try {
        const response = await apiClient.post('/measurements/calculate-body-fat/women/', request);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
};
