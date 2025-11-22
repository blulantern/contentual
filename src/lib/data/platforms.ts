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

export const getPlatformUrl = (platform: SocialPlatform, username: string): string => {
  const metadata = PLATFORM_METADATA[platform];
  return metadata.urlPattern.replace('{username}', username);
};
