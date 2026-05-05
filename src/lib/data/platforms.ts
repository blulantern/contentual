import { SocialPlatform, PlatformMetadata } from '@/types/platforms';

export const PLATFORM_METADATA: Record<SocialPlatform, PlatformMetadata> = {
  tiktok: {
    name: 'TikTok',
    icon: '📱',
    color: '#000000',
    urlPattern: 'https://www.tiktok.com/@{username}',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    urlPattern: 'https://www.instagram.com/{username}',
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    urlPattern: 'https://www.youtube.com/@{username}',
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2',
    urlPattern: 'https://twitter.com/{username}',
  },
};

export const SUPPORTED_PLATFORMS: SocialPlatform[] = [
  'tiktok',
  'instagram',
  'youtube',
  'twitter',
];

const stripHandle = (h: string): string => h.replace(/^@/, '').trim();

export const getPlatformUrl = (platform: SocialPlatform, username: string): string => {
  const metadata = PLATFORM_METADATA[platform];
  return metadata.urlPattern.replace('{username}', stripHandle(username));
};

const HASHTAG_URLS: Record<SocialPlatform, (tag: string) => string> = {
  tiktok: (t) => `https://www.tiktok.com/tag/${t}`,
  instagram: (t) => `https://www.instagram.com/explore/tags/${t}/`,
  youtube: (t) => `https://www.youtube.com/hashtag/${t}`,
  twitter: (t) => `https://twitter.com/hashtag/${t}`,
};

export const hashtagUrl = (platform: SocialPlatform, tag: string): string => {
  const t = encodeURIComponent(tag.replace(/^#/, '').trim());
  return HASHTAG_URLS[platform](t);
};

const SEARCH_URLS: Record<SocialPlatform, (q: string) => string> = {
  tiktok: (q) => `https://www.tiktok.com/search?q=${q}`,
  instagram: (q) => `https://www.instagram.com/explore/search/keyword/?q=${q}`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${q}`,
  twitter: (q) => `https://twitter.com/search?q=${q}`,
};

export const searchUrl = (platform: SocialPlatform, query: string): string => {
  const q = encodeURIComponent(query.trim());
  return SEARCH_URLS[platform](q);
};

// ─── Brand color coordination ────────────────────────────────────────────────
// Tailwind classes are referenced as static literals here so the JIT scanner
// includes them in the generated stylesheet. Don't string-template these.

export interface PlatformClasses {
  /** Solid platform brand color background (use for badges). */
  bg: string;
  /** Brand-tinted background for hover/soft fills. */
  softBg: string;
  /** Brand-colored text. */
  text: string;
  /** Brand-colored border (use as left accent). */
  border: string;
  /** Brand-colored ring on focus. */
  ring: string;
  /** Hover bg on light surfaces. */
  hoverSoftBg: string;
}

export const PLATFORM_CLASSES: Record<SocialPlatform, PlatformClasses> = {
  tiktok: {
    bg: 'bg-platform-tiktok',
    softBg: 'bg-platform-tiktok-soft',
    text: 'text-platform-tiktok',
    border: 'border-platform-tiktok',
    ring: 'focus:ring-platform-tiktok',
    hoverSoftBg: 'hover:bg-platform-tiktok-soft',
  },
  instagram: {
    bg: 'bg-platform-instagram',
    softBg: 'bg-platform-instagram-soft',
    text: 'text-platform-instagram',
    border: 'border-platform-instagram',
    ring: 'focus:ring-platform-instagram',
    hoverSoftBg: 'hover:bg-platform-instagram-soft',
  },
  youtube: {
    bg: 'bg-platform-youtube',
    softBg: 'bg-platform-youtube-soft',
    text: 'text-platform-youtube',
    border: 'border-platform-youtube',
    ring: 'focus:ring-platform-youtube',
    hoverSoftBg: 'hover:bg-platform-youtube-soft',
  },
  twitter: {
    bg: 'bg-platform-twitter',
    softBg: 'bg-platform-twitter-soft',
    text: 'text-platform-twitter',
    border: 'border-platform-twitter',
    ring: 'focus:ring-platform-twitter',
    hoverSoftBg: 'hover:bg-platform-twitter-soft',
  },
};

export const platformClasses = (platform: SocialPlatform): PlatformClasses =>
  PLATFORM_CLASSES[platform];

const PLATFORM_INITIAL: Record<SocialPlatform, string> = {
  tiktok: 'T',
  instagram: 'I',
  youtube: 'Y',
  twitter: 'X',
};

export const platformInitial = (platform: SocialPlatform): string =>
  PLATFORM_INITIAL[platform];

export const platformLabel = (platform: SocialPlatform): string =>
  PLATFORM_METADATA[platform].name;
