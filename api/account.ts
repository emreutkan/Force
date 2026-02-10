import apiClient from './APIClient';
import { getAccountResponse, WeightHistoryResponse } from './types';
import { getErrorMessage, getValidationErrors } from './errorHandler';

// export const getAccount = async (): Promise<getAccountResponse> => {
//   try {
//     const response = await apiClient.get('/user/me/'); // Added trailing slash
//     if (response.status === 200) {
//       return response.data;
//     } else {
//       throw new Error('Failed to get account information /me endpoint');
//     }
//   } catch (error: any) {
//     return (
//       error.message || 'An unknown error occurred while getting account information /me endpoint'
//     );
//   }
// };

export const getAccount = async (): Promise<getAccountResponse | any> => {
  const response = await apiClient.get('/user/me/');
  return response.data;
};

export const updateHeight = async (height: number): Promise<{ height: string; message: string }> => {
  const response = await apiClient.post('/user/height/', { height });
  return response.data;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await apiClient.post('/user/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
};

export const updateGender = async (
  gender: 'male' | 'female'
): Promise<{ gender: string; message: string }> => {
  const response = await apiClient.post('/user/gender/', { gender });
  return response.data;
};

export const updateWeight = async (
  weight: number
): Promise<{ weight: number; message: string }> => {
  const response = await apiClient.post('/user/weight/', { weight });
  return response.data;
};

export const getWeightHistory = async (
  page: number = 1,
  pageSize: number = 100
): Promise<WeightHistoryResponse> => {
  const params: any = {
    page,
    page_size: pageSize,
  };
  const response = await apiClient.get('/user/weight/history/', { params });
  return response.data;
};

export const deleteWeightEntry = async (
  weightId: number,
  deleteBodyfat: boolean = false
): Promise<{ message: string; deleted_date: string; bodyfat_deleted?: boolean }> => {
  const url = deleteBodyfat
    ? `/user/weight/${weightId}/?delete_bodyfat=true`
    : `/user/weight/${weightId}/`;
  const response = await apiClient.delete(url);
  return response.data;
};

export interface ExportDataResponse {
  download_url: string;
  expires_at?: string;
  message?: string;
}

export const exportUserData = async (): Promise<ExportDataResponse> => {
  const response = await apiClient.post('/user/export-data/');
  return response.data;
};
