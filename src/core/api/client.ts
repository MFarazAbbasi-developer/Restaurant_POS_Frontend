import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { authStorage } from '@/core/auth/storage';
import { useAuthStore } from '@/core/auth/authStore';
import { ApiResponse, AuthRefreshData } from '@/types';
import { ApiError } from './errors';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: FailedQueueItem[] = [];

  constructor() {
    this.instance = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: unknown | null, token: string | null = null): void {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private setupInterceptors(): void {
    // Request interceptor: attach token & terminal ID
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const tokens = authStorage.getTokens();
        if (tokens?.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        const terminal = authStorage.getTerminalSession();
        if (terminal?.terminalId && config.headers) {
          config.headers['x-terminal-id'] = terminal.terminalId;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(ApiError.fromAxiosError(error));
      }
    );

    // Response interceptor: handle 401s and token refresh lifecycle
    this.instance.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomRequestConfig | undefined;

        // If not a 401, or is an auth endpoint where refresh shouldn't occur, fail immediately
        if (
          !error.response ||
          error.response.status !== 401 ||
          !originalRequest ||
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/refresh')
        ) {
          return Promise.reject(ApiError.fromAxiosError(error));
        }

        // If request was already retried once, log out and reject
        if (originalRequest._retry) {
          useAuthStore.getState().logout();
          return Promise.reject(ApiError.fromAxiosError(error));
        }

        // If another request is currently refreshing the token, enqueue this request
        if (this.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.instance(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        const currentTokens = authStorage.getTokens();
        const refreshToken = currentTokens?.refreshToken;

        if (!refreshToken) {
          this.isRefreshing = false;
          useAuthStore.getState().logout();
          return Promise.reject(ApiError.fromAxiosError(error));
        }

        try {
          // Perform raw refresh call to avoid recursive interceptor trigger
          const refreshResponse = await axios.post<ApiResponse<AuthRefreshData>>(
            `${env.apiBaseUrl}/auth/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { data } = refreshResponse.data;
          const newTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
          };

          // Store new token pair
          authStorage.setTokens(newTokens);
          useAuthStore.getState().setTokens(newTokens);

          // Retry all queued requests with the new access token
          this.processQueue(null, newTokens.accessToken);

          // Retry original failed request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }

          return this.instance(originalRequest);
        } catch (refreshErr) {
          // Refresh failed (e.g. token expired, revoked, or invalid)
          const convertedError = ApiError.fromAxiosError(
            refreshErr as AxiosError<unknown>
          );
          this.processQueue(convertedError, null);
          useAuthStore.getState().logout();
          return Promise.reject(convertedError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  public getRawInstance(): AxiosInstance {
    return this.instance;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  public async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
