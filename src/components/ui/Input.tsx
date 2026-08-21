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
            className="block text-sm font-medium text-pos-text-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full min-h-[42px] px-3.5 py-2.5 rounded-lg bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-pos-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-pos-danger focus:ring-pos-danger',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-pos-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
