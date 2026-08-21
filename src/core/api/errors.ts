import { AxiosError } from 'axios';

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  raw?: unknown;
}

interface ServerErrorResponseBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Standardized API Error class used throughout the application
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly errors?: Record<string, string[]>;
  readonly raw?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.statusCode = payload.statusCode ?? 500;
    this.code = payload.code;
    this.errors = payload.errors;
    this.raw = payload.raw;
  }

  static fromAxiosError(error: AxiosError<unknown>): ApiError {
    if (error.response) {
      const data = error.response.data as ServerErrorResponseBody | undefined;
      const message =
        data?.message ||
        data?.error ||
        error.message ||
        `Request failed with status ${error.response.status}`;

      return new ApiError({
        message,
        statusCode: error.response.status,
        code: data?.code || error.code,
        errors: data?.errors,
        raw: error.response.data,
      });
    }

    if (error.request) {
      return new ApiError({
        message:
          'No response from server. Check your network or local server connection.',
        statusCode: 0,
        code: 'NETWORK_ERROR',
        raw: error.request,
      });
    }

    return new ApiError({
      message: error.message || 'An unexpected request error occurred.',
      statusCode: 500,
      code: error.code,
      raw: error,
    });
  }
}
