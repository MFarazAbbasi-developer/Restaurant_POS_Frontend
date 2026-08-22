import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-pos-primary hover:bg-pos-primary-hover text-white shadow-xs',
      secondary:
        'bg-pos-surface hover:bg-pos-surface-subtle text-pos-text border border-pos-border shadow-xs',
      danger: 'bg-pos-danger hover:bg-red-700 text-white shadow-xs',
      ghost: 'hover:bg-pos-surface-subtle text-pos-text-secondary hover:text-pos-text',
      outline:
        'border border-pos-border text-pos-text bg-transparent hover:bg-pos-surface-subtle',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-[32px]',
      md: 'px-4 py-2 text-sm min-h-[40px]',
      lg: 'px-5 py-2.5 text-sm sm:text-base min-h-[44px] font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
