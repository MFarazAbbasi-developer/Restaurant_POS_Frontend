import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PRODUCT_IDENTITY } from '@/config/product';
import { SetupApi } from '@/core/api/setupApi';
import { FirstRunSetupForm } from '@/components/setup/FirstRunSetupForm';
import { AppLoadingFallback } from '@/components/boundaries/AppLoadingFallback';
import { ShieldCheck } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await SetupApi.getStatus();
        if (!cancelled) {
          setSetupRequired(status.setupRequired);
        }
      } catch {
        if (!cancelled) {
          setStatusError('Unable to check setup status. Confirm the backend is running.');
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return <AppLoadingFallback />;
  }

  if (!statusError && !setupRequired) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen w-screen bg-pos-bg flex flex-col justify-between text-pos-text select-none p-4 sm:p-6 overflow-y-auto">
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto py-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pos-primary flex items-center justify-center font-bold text-white text-base shadow-xs">
            F
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-pos-text">
              {PRODUCT_IDENTITY.name}
            </h1>
            <p className="text-xs text-pos-text-muted">Initial restaurant setup</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-6">
        {statusError ? (
          <div className="max-w-md text-sm text-pos-danger bg-pos-surface border border-pos-border rounded-lg p-4">
            {statusError}
          </div>
        ) : (
          <FirstRunSetupForm />
        )}
      </main>

      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-pos-text-muted pt-4 border-t border-pos-border">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-pos-primary" />
          <span>Owner credentials are hashed and never stored in plaintext</span>
        </div>
        <div className="font-mono text-[11px]">{PRODUCT_IDENTITY.getSystemLabel()}</div>
      </footer>
    </div>
  );
};
