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
