import Dexie, { Table } from 'dexie';
import { CreatorProfile } from '@/types/profile';
import { WeeklyPlan } from '@/types/plans';
import { TrendItem, ContentIdea } from '@/types/trends';

export interface TrendCache {
  id: string; // niche ID
  nicheName: string;
  trends: TrendItem[];
  cachedAt: Date;
  expiresAt: Date;
}

export class ContentualDatabase extends Dexie {
  profile!: Table<CreatorProfile, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  trends!: Table<TrendItem, string>;
  contentIdeas!: Table<ContentIdea, string>;
  trendCache!: Table<TrendCache, string>;

  constructor() {
    super('ContentualDB');

    this.version(1).stores({
      profile: 'id, generatedAt, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd, type',
      trends: 'id, dateAdded, trendingScore',
      contentIdeas: 'id, difficulty',
    });

    // Add trendCache table in version 2
    this.version(2).stores({
      profile: 'id, generatedAt, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd, type',
      trends: 'id, dateAdded, trendingScore',
      contentIdeas: 'id, difficulty',
      trendCache: 'id, nicheName, cachedAt, expiresAt',
    });
  }
}

export const db = new ContentualDatabase();

export const saveProfile = async (profile: CreatorProfile): Promise<void> => {
  await db.profile.put(profile);
};

export const getProfile = async (): Promise<CreatorProfile | undefined> => {
  const profiles = await db.profile.toArray();
  return profiles[0];
};

export const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  await db.weeklyPlans.put(plan);
};

export const getCurrentWeeklyPlan = async (): Promise<WeeklyPlan | undefined> => {
  const now = new Date();
  const plans = await db.weeklyPlans.where('weekStart').below(now).toArray();
  return plans.find((p) => p.weekEnd > now);
};

export const saveTrends = async (trends: TrendItem[]): Promise<void> => {
  await db.trends.bulkPut(trends);
};

export const getTrends = async (limit: number = 50): Promise<TrendItem[]> => {
  return await db.trends.orderBy('trendingScore').reverse().limit(limit).toArray();
};

export const saveContentIdeas = async (ideas: ContentIdea[]): Promise<void> => {
  await db.contentIdeas.bulkPut(ideas);
};

export const getContentIdeas = async (limit: number = 20): Promise<ContentIdea[]> => {
  return await db.contentIdeas.limit(limit).toArray();
};

// Trend Cache operations
export const getTrendCache = async (nicheId: string): Promise<TrendCache | undefined> => {
  return await db.trendCache.get(nicheId);
};

export const saveTrendCache = async (cache: TrendCache): Promise<void> => {
  await db.trendCache.put(cache);
};

export const getAllTrendCaches = async (): Promise<TrendCache[]> => {
  return await db.trendCache.toArray();
};

export const clearExpiredCaches = async (): Promise<void> => {
  const now = new Date();
  const expired = await db.trendCache.filter((cache) => cache.expiresAt < now).toArray();
  await db.trendCache.bulkDelete(expired.map((c) => c.id));
};

export const clearAllTrendCaches = async (): Promise<void> => {
  await db.trendCache.clear();
};
