import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
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
    default: 'bg-pos-surface-subtle text-pos-text-secondary border border-pos-border',
    primary: 'bg-pos-primary-soft text-pos-primary border border-[#FED7AA]',
    success: 'bg-pos-success-soft text-pos-success border border-[#BBF7D0]',
    warning: 'bg-pos-warning-soft text-pos-warning border border-[#FDE68A]',
    danger: 'bg-pos-danger-soft text-pos-danger border border-[#FECACA]',
    info: 'bg-pos-info-soft text-pos-info border border-[#BFDBFE]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-medium leading-none min-h-[22px]',
    md: 'px-2.5 py-1 text-xs font-semibold leading-none min-h-[26px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full uppercase tracking-wider',
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
