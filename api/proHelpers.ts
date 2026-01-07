import { PROErrorResponse } from './types';

/**
 * Helper function to check if an API error is a PRO feature error
 * @param error - The error object from axios/API call
 * @returns PROErrorResponse if it's a PRO error, null otherwise
 */
export const isPROError = (error: any): PROErrorResponse | null => {
    if (error?.response?.status === 403) {
        const data = error.response.data;
        if (data?.error === 'PRO feature') {
            return data as PROErrorResponse;
        }
    }
    return null;
};

/**
 * Helper function to handle PRO errors - shows upgrade modal if needed
 * @param error - The error object from axios/API call
 * @param onUpgrade - Callback to show upgrade modal
 * @returns true if error was handled, false otherwise
 */
export const handlePROError = (
    error: any,
    onUpgrade: (error: PROErrorResponse) => void
): boolean => {
    const proError = isPROError(error);
    if (proError) {
        onUpgrade(proError);
        return true;
    }
    return false;
};

