import Dexie, { Table } from 'dexie';
import { CreatorProfile } from '@/types/profile';
import { WeeklyPlan } from '@/types/plans';
import {
  TrendItem,
  NicheTrendMeta,
  ContentIdeasCacheRow,
} from '@/types/trends';
import { normalizeTrendTitle } from '../services/trend-normalize';

const SOFT_CAP_PER_NICHE = 500;

export class ContentualDatabase extends Dexie {
  profile!: Table<CreatorProfile, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  trendDictionary!: Table<TrendItem, [number, string]>;
  nicheTrendMeta!: Table<NicheTrendMeta, number>;
  contentIdeasCache!: Table<ContentIdeasCacheRow, string>;

  constructor() {
    super('ContentualDB');

    this.version(1).stores({
      profile: 'id, generatedAt, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd, type',
      trends: 'id, dateAdded, trendingScore',
      contentIdeas: 'id, difficulty',
    });

    this.version(2).stores({
      profile: 'id, generatedAt, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd, type',
      trends: 'id, dateAdded, trendingScore',
      contentIdeas: 'id, difficulty',
      trendCache: 'id, nicheName, cachedAt, expiresAt',
    });

    // v3 — persistent trend dictionary keyed by [nicheId+normalizedKey].
    // Drops `trends`, `contentIdeas`, `trendCache`. Migrates trendCache rows
    // into trendDictionary via the same normalize+merge path the runtime uses.
    this.version(3)
      .stores({
        profile: 'id, generatedAt, lastUpdated',
        weeklyPlans: 'id, weekStart, weekEnd, type',
        trendDictionary:
          '[nicheId+normalizedKey], nicheId, lastSeenAt, [nicheId+trendingScore]',
        nicheTrendMeta: 'nicheId',
        contentIdeasCache: 'cacheKey, expiresAt',
      })
      .upgrade(async (tx) => {
        let oldCaches: any[] = [];
        try {
          oldCaches = await tx.table('trendCache').toArray();
        } catch {
          // table didn't exist (fresh install or already-upgraded) — nothing to do
          return;
        }

        for (const cache of oldCaches) {
          const cachedAt =
            cache.cachedAt instanceof Date ? cache.cachedAt : new Date(cache.cachedAt);
          const nicheIdRaw = cache.id;
          const nicheId =
            typeof nicheIdRaw === 'number' ? nicheIdRaw : parseInt(nicheIdRaw, 10);
          if (!Number.isFinite(nicheId)) continue;

          for (const trend of cache.trends || []) {
            const key = normalizeTrendTitle(trend.title || '');
            if (!key) continue;
            const merged: TrendItem = {
              ...trend,
              nicheId,
              normalizedKey: key,
              firstSeenAt: cachedAt,
              lastSeenAt: cachedAt,
            };
            await tx.table('trendDictionary').put(merged);
          }

          await tx.table('nicheTrendMeta').put({
            nicheId,
            lastFetchedAt: cachedAt,
            viewCursor: 0,
            pageSize: 10,
          } satisfies NicheTrendMeta);
        }
      });
  }
}

export const db = new ContentualDatabase();

// ─── Profile ────────────────────────────────────────────────────────────────

export const saveProfile = async (profile: CreatorProfile): Promise<void> => {
  await db.profile.put(profile);
};

export const getProfile = async (): Promise<CreatorProfile | undefined> => {
  const profiles = await db.profile.toArray();
  return profiles[0];
};

// ─── Weekly Plans ───────────────────────────────────────────────────────────

export const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  await db.weeklyPlans.put(plan);
};

export const getCurrentWeeklyPlan = async (): Promise<WeeklyPlan | undefined> => {
  const now = new Date();
  const plans = await db.weeklyPlans.where('weekStart').below(now).toArray();
  return plans.find((p) => p.weekEnd > now);
};

// ─── Trend dictionary helpers ───────────────────────────────────────────────

/** Soft-cap LRU eviction: drop oldest-by-lastSeenAt until ≤ SOFT_CAP_PER_NICHE. */
export const enforceTrendSoftCap = async (nicheId: number): Promise<void> => {
  const count = await db.trendDictionary.where('nicheId').equals(nicheId).count();
  if (count <= SOFT_CAP_PER_NICHE) return;
  const overflow = count - SOFT_CAP_PER_NICHE;
  const oldest = await db.trendDictionary
    .where('nicheId')
    .equals(nicheId)
    .sortBy('lastSeenAt');
  const toDrop = oldest.slice(0, overflow);
  await db.trendDictionary.bulkDelete(
    toDrop.map((t) => [t.nicheId, t.normalizedKey] as [number, string])
  );
};

export const getTrendsForNiche = async (nicheId: number): Promise<TrendItem[]> => {
  return await db.trendDictionary.where('nicheId').equals(nicheId).toArray();
};

export const countTrendsForNiche = async (nicheId: number): Promise<number> => {
  return await db.trendDictionary.where('nicheId').equals(nicheId).count();
};

// ─── Niche trend meta ───────────────────────────────────────────────────────

export const getNicheTrendMeta = async (
  nicheId: number
): Promise<NicheTrendMeta | undefined> => {
  return await db.nicheTrendMeta.get(nicheId);
};

export const putNicheTrendMeta = async (meta: NicheTrendMeta): Promise<void> => {
  await db.nicheTrendMeta.put(meta);
};

// ─── Content ideas cache ────────────────────────────────────────────────────

export const getContentIdeasCache = async (
  cacheKey: string
): Promise<ContentIdeasCacheRow | undefined> => {
  return await db.contentIdeasCache.get(cacheKey);
};

export const putContentIdeasCache = async (
  row: ContentIdeasCacheRow
): Promise<void> => {
  await db.contentIdeasCache.put(row);
};

export const clearExpiredContentIdeasCaches = async (): Promise<void> => {
  const now = new Date();
  const expired = await db.contentIdeasCache
    .filter((r) => r.expiresAt < now)
    .toArray();
  await db.contentIdeasCache.bulkDelete(expired.map((r) => r.cacheKey));
};
