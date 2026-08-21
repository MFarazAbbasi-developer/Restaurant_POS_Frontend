import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';

interface PublicRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  redirectPath = '/',
  children,
}) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
