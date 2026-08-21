import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/query/queryClient';
import { useAuthStore } from '@/core/auth/authStore';
import { ErrorBoundary } from '@/components/boundaries/ErrorBoundary';
import { AppLoadingFallback } from '@/components/boundaries/AppLoadingFallback';
import { AppRouter } from '@/routes/AppRouter';

export const App: React.FC = () => {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <AppLoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
