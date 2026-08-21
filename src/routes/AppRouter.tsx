import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { POSLayout } from '@/layouts/POSLayout';
import { NotFound } from '@/components/boundaries/NotFound';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { env } from '@/config/env';

/**
 * Root Foundation Landing View
 */
const POSDashboardShell: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-pos-accent/30 bg-pos-surface/60 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-pos-text">
              {env.appName} Engine Ready
            </h2>
            <p className="text-sm text-pos-text-muted mt-1">
              Core architecture and foundation initialized successfully.
            </p>
          </div>
          <Badge variant="success">Foundation Online</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-pos-bg/80 border border-pos-border">
            <span className="text-xs text-pos-text-muted font-medium uppercase">
              API Client
            </span>
            <p className="text-sm font-semibold text-pos-text mt-1">Axios + Zod</p>
            <p className="text-xs text-pos-text-muted mt-0.5 truncate">
              {env.apiBaseUrl}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-pos-bg/80 border border-pos-border">
            <span className="text-xs text-pos-text-muted font-medium uppercase">
              Realtime Stream
            </span>
            <p className="text-sm font-semibold text-pos-text mt-1">Socket.IO Client</p>
            <p className="text-xs text-pos-text-muted mt-0.5 truncate">{env.wsUrl}</p>
          </div>
          <div className="p-4 rounded-lg bg-pos-bg/80 border border-pos-border">
            <span className="text-xs text-pos-text-muted font-medium uppercase">
              State Layers
            </span>
            <p className="text-sm font-semibold text-pos-text mt-1">
              TanStack Query + Zustand
            </p>
            <p className="text-xs text-pos-text-muted mt-0.5">Offline-first ready</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<POSLayout />}>
        <Route index element={<POSDashboardShell />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
