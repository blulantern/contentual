import { SocialPlatform } from './platforms';
import { NicheCategory } from './profile';

export interface TrendItem {
  id: string;
  title: string;
  description: string;
  niche: NicheCategory;
  platforms: SocialPlatform[];
  trendingScore: number;
  hashtags: string[];
  audioTrack?: string;
  exampleLinks: string[];
  dateAdded: Date;
  lastUpdated: Date;
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
