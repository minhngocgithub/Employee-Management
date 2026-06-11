import { boot } from 'quasar/wrappers';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { api } from 'src/lib/http';
import { useAuthStore } from 'src/stores/auth.store';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

export default boot(() => {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    if (authStore.token && config.headers) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        isAuthEndpoint(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      const authStore = useAuthStore();

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken } = await authStore.refreshTokens();
        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        const err =
          refreshError instanceof Error
            ? refreshError
            : new Error('Phiên đăng nhập đã hết hạn');
        processQueue(err, null);
        await authStore.logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    },
  );
});

export { api };
