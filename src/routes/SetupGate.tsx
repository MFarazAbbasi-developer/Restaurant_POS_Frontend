import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SetupApi } from '@/core/api/setupApi';
import { AppLoadingFallback } from '@/components/boundaries/AppLoadingFallback';

/**
 * Routes unauthenticated users to /setup when no restaurant exists yet,
 * and keeps /setup unreachable once setup is complete.
 */
export const SetupGate: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await SetupApi.getStatus();
        if (!cancelled) {
          setSetupRequired(status.setupRequired);
          setFailed(false);
        }
      } catch {
        // If status cannot be loaded, fall through to normal login (backend may be down).
        if (!cancelled) {
          setFailed(true);
          setSetupRequired(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (loading) {
    return <AppLoadingFallback />;
  }

  const onSetupRoute = location.pathname === '/setup';

  if (!failed && setupRequired && !onSetupRoute) {
    return <Navigate to="/setup" replace />;
  }

  if (!failed && !setupRequired && onSetupRoute) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
