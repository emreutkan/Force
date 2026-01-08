
import apiClient from "./APIClient";

export interface DataExportResponse {
    download_url: string;
    expires_at?: string;
    message?: string;
}

export const exportDataJson = async (): Promise<any> => {
    try {
        const response = await apiClient.get('/user/data/export/', { params: { format: 'json' } });
        return response.data;
    } catch (error: any) {
        return { error: error.response?.data?.error || error.message || 'Export failed' };
    }
};

export const exportDataCsv = async (): Promise<any> => {
    try {
        const response = await apiClient.get('/user/data/export/', { params: { format: 'csv' }, responseType: 'blob' });
        return response.data;
    } catch (error: any) {
        return { error: error.response?.data?.error || error.message || 'Export failed' };
    }
};

export const importDataJson = async (jsonData: any): Promise<any> => {
    try {
        const response = await apiClient.post('/user/data/import/', jsonData);
        return response.data;
    } catch (error: any) {
        return { error: error.response?.data?.error || error.message || 'Import failed' };
    }
};

