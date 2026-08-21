import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-pos-surface border border-pos-border shadow-pos',
      surface: 'bg-pos-bg border border-pos-border',
      interactive:
        'bg-pos-surface border border-pos-border hover:border-pos-accent hover:bg-pos-surface-hover transition-all cursor-pointer shadow-pos active:scale-[0.99]',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-xl p-5 text-pos-text', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
