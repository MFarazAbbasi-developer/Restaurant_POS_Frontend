import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Search,
  RotateCw,
  AlertCircle,
  Users,
} from 'lucide-react';
import {
  useStaffListQuery,
  useStaffRolesQuery,
} from '@/features/staff/hooks/useStaffData';
import { CreateStaffModal } from '@/features/staff/components/CreateStaffModal';
import { usePermissions } from '@/core/auth/usePermissions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export const StaffPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('users.manage');

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: staffData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useStaffListQuery({
    search: searchQuery.trim() || undefined,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: roles = [] } = useStaffRolesQuery(canManage);

  const staff = staffData?.items || [];
  const total = staffData?.pagination.total ?? staff.length;

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-pos-text flex items-center gap-2">
            <UserCog size={20} className="text-pos-primary" />
            Staff &amp; User Management
          </h1>
          <p className="text-xs text-pos-text-muted mt-1 max-w-xl">
            List restaurant staff and create accounts with a role and touch PIN. Staff can
            sign in on the terminal after creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5"
          >
            <RotateCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 font-semibold shadow-xs"
            >
              <Plus size={14} />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {!canManage && (
        <div className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border text-xs text-pos-text-secondary">
          You can view staff. Creating or editing accounts requires the{' '}
          <span className="font-semibold text-pos-text">users.manage</span> permission
          (Owner).
        </div>
      )}

      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search name, username, or phone…"
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-pos-border bg-pos-surface text-sm text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span className="font-medium">
            Failed to load staff. Check your connection and permissions.
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 rounded-lg border border-pos-border bg-pos-surface overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-pos-border bg-pos-surface-subtle flex items-center justify-between text-xs text-pos-text-muted">
          <span className="font-semibold flex items-center gap-1.5">
            <Users size={13} />
            {total} staff member{total === 1 ? '' : 's'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
            <Spinner size="lg" />
            <span>Loading staff…</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center gap-3">
            <UserCog size={40} className="text-pos-text-muted/40" />
            <p className="font-bold text-base text-pos-text">No staff found</p>
            <p className="text-xs text-pos-text-secondary max-w-sm">
              {searchQuery.trim()
                ? 'No members match your search.'
                : 'After first-run setup you will see the owner account here. Add cashiers or waiters when you are ready.'}
            </p>
            {canManage && !searchQuery.trim() && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="font-semibold mt-1"
              >
                + Add first staff member
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-pos-surface-subtle border-b border-pos-border text-pos-text-muted font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Roles</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-pos-surface-subtle transition-colors">
                    <td className="p-3 font-semibold text-pos-text">{member.name}</td>
                    <td className="p-3 font-mono text-pos-primary">{member.username}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map(role => (
                          <Badge key={role.id} variant="default" size="sm" className="text-[10px]">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-pos-text-secondary">{member.phone || '—'}</td>
                    <td className="p-3">
                      <Badge
                        variant={member.isActive ? 'success' : 'default'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-pos-text-muted">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleString()
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && canManage && (
        <CreateStaffModal
          roles={roles}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
