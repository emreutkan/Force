import apiClient from './APIClient';

export interface Supplement {
    id: number;
    name: string;
    description: string;
    dosage_unit: string;
    default_dosage: number;
}

export interface UserSupplement {
    id: number;
    supplement_id: number;
    supplement_details: Supplement;
    dosage: number;
    frequency: string;
    time_of_day: string;
    is_active: boolean;
}

export interface CreateUserSupplementRequest {
    supplement_id: number;
    dosage: number;
    frequency: string;
    time_of_day?: string;
}

export const getSupplements = async (): Promise<Supplement[]> => {
    try {
        const response = await apiClient.get('/supplements/list/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching supplements:', error);
        return [];
    }
}

export const getUserSupplements = async (): Promise<UserSupplement[]> => {
    try {
        const response = await apiClient.get('/supplements/user/list/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user supplements:', error);
        return [];
    }
}

export const addUserSupplement = async (data: CreateUserSupplementRequest): Promise<UserSupplement | null> => {
    try {
        const response = await apiClient.post('/supplements/user/add/', data);
        return response.data;
    } catch (error: any) {
        console.error('Error adding user supplement:', error);
        return null;
    }
}

