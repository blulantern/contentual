'use client';

import { ExternalLink } from 'lucide-react';
import {
  platformClasses,
  platformInitial,
  platformLabel,
} from '@/lib/data/platforms';
import type { SocialPlatform } from '@/types/platforms';

export type PlatformLinkVariant = 'chip' | 'compact' | 'inline';

interface PlatformLinkProps {
  platform: SocialPlatform;
  href: string;
  children: React.ReactNode;
  variant?: PlatformLinkVariant;
  /** Tooltip-style title; defaults to "<text> on <Platform>". */
  title?: string;
  /** Extra classes appended after the variant defaults. */
  className?: string;
}

/**
 * External link styled with the destination platform's brand color, so the
 * user can recognize where they're headed before clicking.
 *
 * - `chip` — full pill with platform-letter badge + brand left border + external icon.
 * - `compact` — small pill, no badge, brand-colored text, used for hashtags.
 * - `inline` — text-only link with brand-colored hover underline, used in prose.
 */
export default function PlatformLink({
  platform,
  href,
  children,
  variant = 'chip',
  title,
  className = '',
}: PlatformLinkProps) {
  const c = platformClasses(platform);
  const label = platformLabel(platform);
  const childText =
    typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';
  const computedTitle = title ?? (childText ? `${childText} on ${label}` : `Open on ${label}`);

  if (variant === 'compact') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={computedTitle}
        className={[
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold',
          'bg-white border',
          c.border,
          c.text,
          c.hoverSoftBg,
          'transition-colors',
          className,
        ].join(' ')}
      >
        <span className={[
          'w-3.5 h-3.5 rounded-sm text-[9px] font-bold flex items-center justify-center text-white flex-shrink-0',
          c.bg,
        ].join(' ')}>
          {platformInitial(platform)}
        </span>
        <span>{children}</span>
      </a>
    );
  }

  if (variant === 'inline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={computedTitle}
        className={[
          'inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline',
          c.text,
          className,
        ].join(' ')}
      >
        {children}
        <ExternalLink className="w-3 h-3 opacity-70" />
      </a>
    );
  }

  // chip (default)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={computedTitle}
      className={[
        'inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm group',
        'bg-white border-l-4 border-y border-r border-y-gray-100 border-r-gray-100',
        c.border,
        'hover:shadow-sm transition-all',
        c.hoverSoftBg,
        className,
      ].join(' ')}
    >
      <span
        className={[
          'w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0',
          c.bg,
        ].join(' ')}
        aria-label={label}
      >
        {platformInitial(platform)}
      </span>
      <span className="font-medium text-gray-800">{children}</span>
      <ExternalLink className={['w-3 h-3 opacity-70 group-hover:opacity-100', c.text].join(' ')} />
    </a>
  );
}
