'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/cn';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-1.5 shadow-inner-soft border border-gray-200/50',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-contentual-pink focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'hover:text-contentual-pink/80',
      'data-[state=active]:bg-white data-[state=active]:text-contentual-pink data-[state=active]:shadow-soft data-[state=active]:scale-[1.02]',
      'data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-white/50',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6 animate-fade-in',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-contentual-pink focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
