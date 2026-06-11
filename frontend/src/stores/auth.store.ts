import { defineStore } from 'pinia';
import { authApi } from 'src/api/auth.api';
import type { AuthUser, LoginPayload, TokenResponse } from 'src/types/auth.types';

const TOKEN_KEY = 'ems_access_token';
const USER_KEY = 'ems_user';

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(TOKEN_KEY),
    user: loadStoredUser(),
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken,
    token: (state): string | null => state.accessToken,
    role: (state) => state.user?.role ?? null,
    mustChangePassword: (state): boolean =>
      state.user?.must_change_password === true,
  },

  actions: {
    setSession({ accessToken, user }: TokenResponse): void {
      this.accessToken = accessToken;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    clearSession(): void {
      this.accessToken = null;
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    async login(payload: LoginPayload): Promise<TokenResponse> {
      const response = await authApi.login(payload);
      this.setSession(response);
      return response;
    },

    async logout(): Promise<void> {
      try {
        if (this.accessToken) {
          await authApi.logout();
        }
      } finally {
        this.clearSession();
      }
    },

    async refreshTokens(): Promise<TokenResponse> {
      const response = await authApi.refresh();
      this.setSession(response);
      return response;
    },

    markPasswordChanged(): void {
      if (!this.user) return;
      this.user = { ...this.user, must_change_password: false };
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    },
  },
});
