import apiClient from './APIClient';
import { ResearchFilters, TrainingResearch } from './types';

export const getResearch = async (filters?: ResearchFilters): Promise<TrainingResearch[] | any> => {
    try {
        const params: any = {};
        if (filters?.category) params.category = filters.category;
        if (filters?.muscle_group) params.muscle_group = filters.muscle_group;
        if (filters?.exercise_type) params.exercise_type = filters.exercise_type;
        if (filters?.tags && filters.tags.length > 0) {
            params.tags = filters.tags;
        }
        
        const response = await apiClient.get('/workout/research/', { params });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            return error.response.data;
        }
        return error.message || 'An unknown error occurred';
    }
};
