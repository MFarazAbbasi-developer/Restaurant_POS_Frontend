import React from 'react';
import { Outlet } from 'react-router-dom';
import { usePermissions } from '@/core/auth/usePermissions';
import { AccessDenied } from '@/components/boundaries/AccessDenied';

interface RequirePermissionProps {
  permissionKey?: string;
  moduleName?: string;
  children?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permissionKey,
  moduleName,
  children,
}) => {
  const { hasPermission } = usePermissions();

  if (permissionKey && !hasPermission(permissionKey)) {
    return <AccessDenied requiredPermission={permissionKey} moduleName={moduleName} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
