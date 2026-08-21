import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/core/api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep fresh for 1 minute unless invalidated (POS state is updated primarily via socket events or user action)
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10, // 10 minutes cache garbage collection
      refetchOnWindowFocus: false, // Prevent jarring refetches on touchscreens during operation
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // Do not retry on client errors (400, 401, 403, 404, 422)
          if (error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
