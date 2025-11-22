import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const inputVariants = cva(
  'flex w-full bg-white transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-2 border-gray-200 focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/10 focus:outline-none hover:border-gray-300',
        filled:
          'border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-contentual-pink focus:outline-none',
        ghost:
          'border-0 border-b-2 border-gray-200 rounded-none focus:border-contentual-pink focus:outline-none px-0',
      },
      inputSize: {
        default: 'h-12 px-4 py-3 text-base rounded-xl',
        sm: 'h-9 px-3 py-2 text-sm rounded-lg',
        lg: 'h-14 px-5 py-4 text-lg rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  size?: 'default' | 'sm' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize: size || inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
