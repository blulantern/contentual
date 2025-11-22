export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';

export interface PlatformConnection {
  platform: SocialPlatform;
  username: string;
  connected: boolean;
  followerCount?: number;
}

export interface PlatformMetadata {
  name: string;
  icon: string;
  color: string;
  urlPattern: string;
}
