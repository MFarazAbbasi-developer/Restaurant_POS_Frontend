import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-pos-surface text-pos-text border border-pos-border',
    success: 'bg-pos-success-bg text-pos-success border border-pos-success/30',
    warning: 'bg-pos-warning-bg text-pos-warning border border-pos-warning/30',
    danger: 'bg-pos-danger-bg text-pos-danger border border-pos-danger/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
