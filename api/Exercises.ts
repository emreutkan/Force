import apiClient from './APIClient';

export const getExercises = async (query: string = '') => {
    try {
        const response = await apiClient.get(`/exercise/list/`, {
            params: { search: query }
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const addExerciseToWorkout = async (workoutId: number, exerciseId: number) => {
    try {
        const response = await apiClient.post(`/exercise/add/${workoutId}/`, {
            exercise_id: exerciseId
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const removeExerciseFromWorkout = async (workoutId: number, exerciseId: number) => {
    try {
        const response = await apiClient.post(`/exercise/remove/${workoutId}/`, {
            exercise_id: exerciseId
        });
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export interface AddSetRequest {
    reps: number;
    weight: number;
    rest_time_before_set?: number;
    is_warmup?: boolean;
    reps_in_reserve?: number;
}

export const addSetToExercise = async (workoutExerciseId: number, data: AddSetRequest) => {
    try {
        const response = await apiClient.post(`/workout/exercise/${workoutExerciseId}/add_set/`, data);
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}

export const deleteSet = async (setId: number) => {
    try {
        const response = await apiClient.delete(`/workout/set/${setId}/delete/`);
        return response.status === 204;
    } catch (error: any) {
        return false;
    }
}

export interface UpdateSetRequest {
    reps?: number;
    weight?: number;
    reps_in_reserve?: number;
}

export const updateSet = async (setId: number, data: UpdateSetRequest) => {
    try {
        const response = await apiClient.patch(`/workout/set/${setId}/update/`, data);
        return response.data;
    } catch (error: any) {
        return error.message || 'An unknown error occurred';
    }
}
