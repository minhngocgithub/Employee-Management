import { api } from 'src/lib/http';
import type {
  ChangePasswordPayload,
  LoginPayload,
  TokenResponse,
} from 'src/types/auth.types';

export const authApi = {
  login(payload: LoginPayload): Promise<TokenResponse> {
    return api.post<TokenResponse>('/auth/login', payload).then((res) => res.data);
  },

  logout(): Promise<void> {
    return api.post('/auth/logout').then(() => undefined);
  },

  refresh(): Promise<TokenResponse> {
    return api.post<TokenResponse>('/auth/refresh').then((res) => res.data);
  },

  changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return api
      .patch<{ message: string }>('/auth/change-password', payload)
      .then((res) => res.data);
  },
};
