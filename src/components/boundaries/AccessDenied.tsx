import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/core/auth/authStore';

interface AccessDeniedProps {
  requiredPermission?: string;
  moduleName?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  moduleName = 'this section',
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-pos-surface border-pos-border shadow-modal p-6 sm:p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-lg bg-pos-danger-soft border border-[#FECACA] text-pos-danger">
          <ShieldAlert size={32} />
        </div>

        <div>
          <Badge variant="danger" className="mb-2">
            RBAC Access Denied
          </Badge>
          <h2 className="text-xl font-bold text-pos-text">Permission Required</h2>
          <p className="text-sm text-pos-text-muted mt-2 leading-relaxed">
            Your staff account does not have sufficient authorization to access{' '}
            <span className="font-semibold text-pos-text">{moduleName}</span> on this
            terminal.
          </p>
        </div>

        {/* Security context details */}
        <div className="bg-pos-bg/80 border border-pos-border rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center text-pos-text-muted">
            <span>Current Operator:</span>
            <span className="font-semibold text-pos-text">
              {user?.name || 'Unknown'} (@{user?.username})
            </span>
          </div>
          {requiredPermission && (
            <div className="flex justify-between items-center text-pos-text-muted pt-1 border-t border-pos-border/40 font-mono">
              <span className="flex items-center gap-1">
                <Lock size={12} className="text-pos-danger" /> Required Key:
              </span>
              <span className="text-pos-danger font-semibold bg-pos-danger/10 px-2 py-0.5 rounded">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
