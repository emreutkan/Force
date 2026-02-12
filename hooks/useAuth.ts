import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/Auth';
import { LoginRequest, LoginResponse } from '@/api/types/auth';
import { storeAccessToken, storeRefreshToken } from './Storage';

export const useLogin = () => {
  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (data: LoginResponse) => {
      storeAccessToken(data.access);
      storeRefreshToken(data.refresh);
    },
  });
};
