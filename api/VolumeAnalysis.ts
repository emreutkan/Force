import apiClient from './APIClient';
import { VolumeAnalysisFilters, VolumeAnalysisResponse } from './types';

export const getVolumeAnalysis = async (filters?: VolumeAnalysisFilters): Promise<VolumeAnalysisResponse | any> => {
    try {
        const params: any = {};
        if (filters?.weeks_back !== undefined) params.weeks_back = filters.weeks_back;
        if (filters?.start_date) params.start_date = filters.start_date;
        if (filters?.end_date) params.end_date = filters.end_date;
        
        const response = await apiClient.get('/workout/volume-analysis/', { params });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
};
