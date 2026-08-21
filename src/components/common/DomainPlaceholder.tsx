import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon, Layers, Server, Shield, Sparkles } from 'lucide-react';

interface DomainPlaceholderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  apiPrefix: string;
  permissionKey?: string;
  features: string[];
}

export const DomainPlaceholder: React.FC<DomainPlaceholderProps> = ({
  title,
  subtitle,
  icon: Icon,
  apiPrefix,
  permissionKey,
  features,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <Card className="border-pos-accent/30 bg-pos-surface/60 backdrop-blur p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-pos-accent/15 border border-pos-accent/30 flex items-center justify-center font-bold text-pos-accent shrink-0 shadow-sm">
              <Icon size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-pos-text">{title}</h2>
                <Badge variant="default">Module Shell Ready</Badge>
              </div>
              <p className="text-xs text-pos-text-muted mt-1 max-w-xl">{subtitle}</p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end gap-1.5 shrink-0">
            {permissionKey && (
              <span className="text-[11px] font-mono bg-pos-bg/80 border border-pos-border px-2.5 py-1 rounded-lg text-pos-text-muted flex items-center gap-1">
                <Shield size={12} className="text-pos-accent" />
                {permissionKey}
              </span>
            )}
            <span className="text-[11px] font-mono bg-pos-bg/80 border border-pos-border px-2.5 py-1 rounded-lg text-pos-text-muted flex items-center gap-1">
              <Server size={12} className="text-pos-text-muted" />
              {apiPrefix}
            </span>
          </div>
        </div>

        {/* Feature Scope & Capabilities Grid */}
        <div className="mt-6 pt-6 border-t border-pos-border/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-pos-text-muted tracking-wider mb-3">
            <Layers size={14} className="text-pos-accent" />
            <span>Target Feature Scope</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-pos-bg/70 border border-pos-border text-xs flex items-start gap-2.5"
              >
                <Sparkles size={14} className="text-pos-accent shrink-0 mt-0.5" />
                <span className="text-pos-text font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
