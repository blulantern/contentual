import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-contentual-pink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-primary text-white shadow-colored hover:shadow-colored-lg hover:scale-105 border border-transparent',
        secondary:
          'bg-white text-contentual-pink border-2 border-contentual-pink/20 shadow-card hover:shadow-soft hover:border-contentual-pink/40',
        ghost:
          'bg-transparent text-gray-700 hover:bg-contentual-pink/5 hover:text-contentual-pink',
        outline:
          'border-2 border-contentual-pink text-contentual-pink bg-transparent hover:bg-contentual-pink hover:text-white',
        destructive:
          'bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg',
        link:
          'text-contentual-pink underline-offset-4 hover:underline bg-transparent',
        soft:
          'bg-contentual-pink/10 text-contentual-pink hover:bg-contentual-pink/20 border border-contentual-pink/20',
      },
      size: {
        default: 'h-11 px-6 py-2.5 text-base rounded-xl',
        sm: 'h-9 px-4 py-2 text-sm rounded-lg',
        lg: 'h-14 px-8 py-3.5 text-lg rounded-2xl',
        xl: 'h-16 px-10 py-4 text-xl rounded-2xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
