import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-semibold transition-all',
  {
    variants: {
      variant: {
        default:
          'bg-contentual-pink/10 text-contentual-pink border border-contentual-pink/20 hover:bg-contentual-pink/20',
        secondary:
          'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200',
        accent:
          'bg-contentual-peach/10 text-contentual-peach-800 border border-contentual-peach/20 hover:bg-contentual-peach/20',
        coral:
          'bg-contentual-coral/10 text-contentual-coral-800 border border-contentual-coral/20 hover:bg-contentual-coral/20',
        cream:
          'bg-contentual-cream/30 text-contentual-cream-900 border border-contentual-cream/40 hover:bg-contentual-cream/40',
        outline:
          'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50',
        gradient:
          'bg-gradient-primary text-white border-none shadow-sm hover:shadow-md',
        solid:
          'bg-contentual-pink text-white border-none hover:bg-contentual-pink-600',
      },
      size: {
        default: 'h-6 px-3 text-xs rounded-full',
        sm: 'h-5 px-2 text-[10px] rounded-full',
        lg: 'h-8 px-4 text-sm rounded-full',
        xl: 'h-10 px-5 text-base rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
