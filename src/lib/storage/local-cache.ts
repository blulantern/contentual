/**
 * IndexedDB cache (Dexie). Sits in front of Supabase to make reads fast.
 * Supabase is the source of truth for persistence; this layer is purely
 * a per-browser speed cache.
 *
 * Schema mirrors the Supabase tables but in their camelCase TS shape, so
 * cached values can be returned to callers without translation.
 */

import Dexie, { Table } from 'dexie';
import { CreatorProfile } from '@/types/profile';
import { WeeklyPlan } from '@/types/plans';
import {
  TrendItem,
  NicheTrendMeta,
  ContentIdeasCacheRow,
} from '@/types/trends';

class ContentualCache extends Dexie {
  profile!: Table<CreatorProfile, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  trendDictionary!: Table<TrendItem, [number, string]>;
  nicheTrendMeta!: Table<NicheTrendMeta, number>;
  contentIdeasCache!: Table<ContentIdeasCacheRow, string>;

  constructor() {
    super('ContentualCache');

    // v1 (this rename) creates the cache tables fresh. The previous
    // (pre-Supabase) database was named "ContentualDB" — leave it alone;
    // users wanting to wipe stale local data can do so via DevTools.
    this.version(1).stores({
      profile: 'id, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd',
      trendDictionary:
        '[nicheId+normalizedKey], nicheId, lastSeenAt, [nicheId+trendingScore]',
      nicheTrendMeta: 'nicheId',
      contentIdeasCache: 'cacheKey, expiresAt',
    });
  }
}

let _cache: ContentualCache | null = null;
const isBrowser = (): boolean => typeof window !== 'undefined' && 'indexedDB' in window;

/** Returns the cache instance, or `null` if IndexedDB is unavailable
 *  (SSR, Safari private mode, hard browser restrictions). All callers must
 *  handle null gracefully — the cache is a speed-up, not a correctness
 *  requirement. */
export const getCache = (): ContentualCache | null => {
  if (!isBrowser()) return null;
  if (!_cache) _cache = new ContentualCache();
  return _cache;
};

/** Run a Dexie operation, swallowing any failure. Cache is best-effort:
 *  a failed write or read shouldn't propagate to the caller. */
export const tryCache = async <T>(
  op: (cache: ContentualCache) => Promise<T>
): Promise<T | undefined> => {
  const c = getCache();
  if (!c) return undefined;
  try {
    return await op(c);
  } catch (err) {
    console.warn('[local-cache] op failed:', err);
    return undefined;
  }
};
