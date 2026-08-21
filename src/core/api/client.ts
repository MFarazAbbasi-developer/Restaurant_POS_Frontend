import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';
import { authStorage } from '@/core/auth/storage';
import { useAuthStore } from '@/core/auth/authStore';
import { ApiError } from './errors';

class ApiClient {
  private instance: AxiosInstance;

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

    // Response interceptor: handle errors & 401s
    this.instance.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid -> log out
          useAuthStore.getState().logout();
        }

        const apiError = ApiError.fromAxiosError(error);
        return Promise.reject(apiError);
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
