import { useMemo } from 'react';
import { useAuthStore } from './authStore';

export const usePermissions = () => {
  const user = useAuthStore(state => state.user);

  const permissions = useMemo(() => {
    if (!user || !user.permissions) return [];
    return user.permissions;
  }, [user]);

  const roles = useMemo(() => {
    if (!user || !user.roles) return [];
    return user.roles.map(r => (typeof r === 'string' ? r : r.name));
  }, [user]);

  const hasPermission = (permissionKey: string): boolean => {
    return permissions.includes(permissionKey);
  };

  const hasAnyPermission = (keys: string[]): boolean => {
    return keys.some(k => permissions.includes(k));
  };

  const hasAllPermissions = (keys: string[]): boolean => {
    return keys.every(k => permissions.includes(k));
  };

  const hasRole = (roleName: string): boolean => {
    return roles.map(r => r.toUpperCase()).includes(roleName.toUpperCase());
  };

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isOwner: hasRole('OWNER'),
    isManager: hasRole('MANAGER') || hasRole('OWNER'),
    isCashier: hasRole('CASHIER'),
  };
};
