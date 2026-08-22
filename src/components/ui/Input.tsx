import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-pos-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full min-h-[40px] px-3 py-2 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder-pos-text-muted text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary disabled:opacity-50 disabled:bg-pos-surface-subtle disabled:cursor-not-allowed',
            error && 'border-pos-danger focus:ring-pos-danger/20 focus:border-pos-danger',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-pos-danger font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
