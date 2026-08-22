import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-pos-surface border border-pos-border',
      subtle: 'bg-pos-surface-subtle border border-pos-border',
      interactive:
        'bg-pos-surface border border-pos-border hover:border-pos-border-strong hover:bg-pos-surface-subtle transition-colors duration-150 cursor-pointer select-none',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg p-5 text-pos-text', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
