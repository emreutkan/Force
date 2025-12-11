import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storeAccessToken = async (token: string) => {
    if (isWeb) {
        localStorage.setItem('access_token', token);
    } else {
        await SecureStore.setItemAsync('access_token', token);
    }
}

export const storeRefreshToken = async (token: string) => {
    if (isWeb) {
        localStorage.setItem('refresh_token', token);
    } else {
        await SecureStore.setItemAsync('refresh_token', token);
    }
}

export const getAccessToken = async () => {
    if (isWeb) {
        return localStorage.getItem('access_token');
    }
    return await SecureStore.getItemAsync('access_token');
}

export const getRefreshToken = async () => {
    if (isWeb) {
        return localStorage.getItem('refresh_token');
    }
    return await SecureStore.getItemAsync('refresh_token');
}

export const clearTokens = async () => {
    if (isWeb) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    } else {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
    }
}