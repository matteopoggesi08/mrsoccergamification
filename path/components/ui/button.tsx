import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
          variant === 'default' &&
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
          variant === 'outline' &&
            'border border-input bg-transparent hover:bg-accent',
          variant === 'ghost' && 'hover:bg-accent',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
