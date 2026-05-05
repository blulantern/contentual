import { SocialPlatform } from './platforms';
import { NicheCategory } from './profile';

export interface TrendItem {
  id: string;
  normalizedKey: string;
  nicheId: number;
  niche: NicheCategory;
  title: string;
  description: string;
  platforms: SocialPlatform[];
  trendingScore: number;
  hashtags: string[];
  audioTrack?: string;
  exampleLinks: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface NicheTrendMeta {
  nicheId: number;
  lastFetchedAt: Date;
  viewCursor: number;
  pageSize: number;
}

export type ContentDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  niche: NicheCategory;
  difficulty: ContentDifficulty;
  timeEstimate: number;
  equipment: string[];
  platforms: SocialPlatform[];
  steps: string[];
  relatedTrends: string[];
}

export interface ContentIdeasCacheRow {
  cacheKey: string;
  nicheIds: number[];
  platforms: SocialPlatform[];
  ideas: ContentIdea[];
  trendTitlesUsed: string[];
  generatedAt: Date;
  expiresAt: Date;
}
