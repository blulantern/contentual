import { SocialPlatform, PlatformConnection } from './platforms';

export interface NicheCategory {
  id: number;
  name: string;
  category?: string;
}

export interface CreatorSurvey {
  goals: string;
  timeCommitment: number;
  challenges: string[];
  preferredFormats: string[];
  equipment: string[];
  /** Free-form: what the creator's content is actually about. */
  contentTopics: string;
  /** Recent post / video titles — concrete content signal for niche matching. */
  recentPostTitles: string[];
  /** Optional: who watches / who they want to watch. */
  audience?: string;
}

export interface NicheMatch extends NicheCategory {
  confidence: number;
  reasoning: string;
}

export interface SimilarCreator {
  name: string;
  platform: SocialPlatform;
  /** Optional handle for linking to the creator's platform profile. */
  handle?: string;
  followerCount: string;
  niche: string;
  keySuccessFactors: string[];
  contentStyle: string;
}

export interface EngagementStrategy {
  platform: SocialPlatform;
  strategies: string[];
}

export interface Influencer {
  name: string;
  platform: SocialPlatform;
  handle: string;
  followersRange: string;
  specialization: string;
}

export interface TopInfluencer {
  niche: string;
  influencers: Influencer[];
}

export interface BaselineProfile {
  summary: string;
  contentStyle: string;
  strengths: string[];
  opportunities: string[];
}

export interface CreatorProfile {
  id: string;
  platforms: PlatformConnection[];
  survey: CreatorSurvey;
  topNiches: NicheMatch[];
  similarCreators: SimilarCreator[];
  engagementStrategies: EngagementStrategy[];
  topInfluencers: TopInfluencer[];
  baselineProfile?: BaselineProfile;
  generatedAt: Date;
  lastUpdated: Date;
}
