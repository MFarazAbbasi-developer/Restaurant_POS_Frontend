import React from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { env } from '@/config/env';

export const AppLoadingFallback: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-pos-bg flex flex-col items-center justify-center text-pos-text select-none">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-14 w-14 rounded-lg bg-pos-primary-soft border border-[#FED7AA] flex items-center justify-center shadow-xs">
          <Spinner size="lg" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-pos-text tracking-wide">{env.appName}</h2>
          <p className="text-xs text-pos-text-muted mt-1">
            Initializing POS terminal environment...
          </p>
        </div>
      </div>
    </div>
  );
};
