/**
 * Persistence facade.
 *
 * Layers, top to bottom:
 *  1. **Local cache** (IndexedDB / Dexie, see local-cache.ts) — fast reads,
 *     per-browser. Best-effort: failures are swallowed, never propagated.
 *  2. **Supabase Postgres** (see supabase.ts + supabase/schema.sql) — the
 *     source of truth. Survives across browsers and devices. Single-user
 *     app: anon role has full RLS access (do NOT deploy publicly).
 *
 * Read pattern: try cache → on miss, hit Supabase, populate cache, return.
 * Write pattern: write to Supabase first (durable), then mirror to cache.
 *
 * Callers should not need to know about either layer — the exported helpers
 * preserve the same signatures the rest of the app already uses.
 *
 * Boundary rules:
 *  - Postgres uses snake_case columns; the TS API uses camelCase. Do the
 *    mapping at the Supabase boundary.
 *  - `timestamptz` columns come back as ISO strings. Revive to `Date` here.
 *  - JSONB carries arbitrary objects (Profile, WeeklyPlan, etc.) and any
 *    nested Date fields will round-trip as strings. Revive explicitly.
 */

import { CreatorProfile } from '@/types/profile';
import { WeeklyPlan } from '@/types/plans';
import { TrendItem, NicheTrendMeta, ContentIdeasCacheRow } from '@/types/trends';
import { getSupabase } from './supabase';
import { tryCache } from './local-cache';

const SOFT_CAP_PER_NICHE = 500;

const sb = () => getSupabase();

// ─── helpers: date revival ──────────────────────────────────────────────────

const toDate = (v: unknown): Date => {
  if (v instanceof Date) return v;
  return new Date(v as string);
};

const reviveProfile = (raw: any): CreatorProfile => ({
  ...raw,
  generatedAt: toDate(raw.generatedAt),
  lastUpdated: toDate(raw.lastUpdated),
});

const reviveWeeklyPlan = (raw: any): WeeklyPlan => ({
  ...raw,
  weekStart: toDate(raw.weekStart),
  weekEnd: toDate(raw.weekEnd),
  generatedAt: toDate(raw.generatedAt),
  days: (raw.days ?? []).map((d: any) => ({
    ...d,
    date: toDate(d.date),
  })),
});

// ─── Profile ────────────────────────────────────────────────────────────────

const sbGetProfile = async (): Promise<CreatorProfile | undefined> => {
  const { data, error } = await sb()
    .from('profile')
    .select('data')
    .order('last_updated', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return undefined;
  return reviveProfile(data[0].data);
};

const sbPutProfile = async (profile: CreatorProfile): Promise<void> => {
  const { error } = await sb()
    .from('profile')
    .upsert({
      id: profile.id,
      data: profile,
      generated_at: profile.generatedAt.toISOString(),
      last_updated: profile.lastUpdated.toISOString(),
    });
  if (error) throw error;
};

export const getProfile = async (): Promise<CreatorProfile | undefined> => {
  // Cache: most-recent by lastUpdated.
  const cached = await tryCache(async (c) => {
    const rows = await c.profile.orderBy('lastUpdated').reverse().limit(1).toArray();
    return rows[0] ? reviveProfile(rows[0]) : undefined;
  });
  if (cached) return cached;

  const fromSb = await sbGetProfile();
  if (fromSb) {
    await tryCache((c) => c.profile.put(fromSb));
  }
  return fromSb;
};

export const saveProfile = async (profile: CreatorProfile): Promise<void> => {
  await sbPutProfile(profile);
  await tryCache((c) => c.profile.put(profile));
};

// ─── Weekly Plans ───────────────────────────────────────────────────────────

const sbGetCurrentWeeklyPlan = async (): Promise<WeeklyPlan | undefined> => {
  const nowIso = new Date().toISOString();
  const { data, error } = await sb()
    .from('weekly_plans')
    .select('data')
    .lte('week_start', nowIso)
    .gte('week_end', nowIso)
    .order('week_start', { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return undefined;
  return reviveWeeklyPlan(data[0].data);
};

const sbPutWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  const { error } = await sb()
    .from('weekly_plans')
    .upsert({
      id: plan.id,
      type: plan.type,
      week_start: plan.weekStart.toISOString(),
      week_end: plan.weekEnd.toISOString(),
      data: plan,
    });
  if (error) throw error;
};

export const getCurrentWeeklyPlan = async (): Promise<WeeklyPlan | undefined> => {
  const cached = await tryCache(async (c) => {
    const now = new Date();
    const candidates = await c.weeklyPlans
      .where('weekStart')
      .belowOrEqual(now)
      .toArray();
    const match = candidates.find((p) => p.weekEnd >= now);
    return match ? reviveWeeklyPlan(match) : undefined;
  });
  if (cached) return cached;

  const fromSb = await sbGetCurrentWeeklyPlan();
  if (fromSb) {
    await tryCache((c) => c.weeklyPlans.put(fromSb));
  }
  return fromSb;
};

export const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  await sbPutWeeklyPlan(plan);
  await tryCache((c) => c.weeklyPlans.put(plan));
};

// ─── Trend dictionary ───────────────────────────────────────────────────────

const trendRowToItem = (row: any): TrendItem => ({
  id: row.id,
  normalizedKey: row.normalized_key,
  nicheId: row.niche_id,
  niche: row.niche,
  title: row.title,
  description: row.description,
  platforms: row.platforms ?? [],
  trendingScore: row.trending_score ?? 0,
  hashtags: row.hashtags ?? [],
  audioTrack: row.audio_track ?? undefined,
  exampleLinks: row.example_links ?? [],
  firstSeenAt: toDate(row.first_seen_at),
  lastSeenAt: toDate(row.last_seen_at),
});

const trendItemToRow = (t: TrendItem): Record<string, any> => ({
  niche_id: t.nicheId,
  normalized_key: t.normalizedKey,
  id: t.id,
  title: t.title,
  description: t.description,
  platforms: t.platforms,
  trending_score: t.trendingScore,
  hashtags: t.hashtags,
  audio_track: t.audioTrack ?? null,
  example_links: t.exampleLinks,
  niche: t.niche,
  first_seen_at: t.firstSeenAt.toISOString(),
  last_seen_at: t.lastSeenAt.toISOString(),
});

const sbGetTrendByKey = async (
  nicheId: number,
  normalizedKey: string
): Promise<TrendItem | undefined> => {
  const { data, error } = await sb()
    .from('trend_dictionary')
    .select('*')
    .eq('niche_id', nicheId)
    .eq('normalized_key', normalizedKey)
    .maybeSingle();
  if (error) throw error;
  return data ? trendRowToItem(data) : undefined;
};

const sbPutTrend = async (trend: TrendItem): Promise<void> => {
  const { error } = await sb()
    .from('trend_dictionary')
    .upsert(trendItemToRow(trend));
  if (error) throw error;
};

const sbGetTrendsForNiche = async (nicheId: number): Promise<TrendItem[]> => {
  const { data, error } = await sb()
    .from('trend_dictionary')
    .select('*')
    .eq('niche_id', nicheId);
  if (error) throw error;
  return (data ?? []).map(trendRowToItem);
};

export const getTrendByKey = async (
  nicheId: number,
  normalizedKey: string
): Promise<TrendItem | undefined> => {
  const cached = await tryCache((c) =>
    c.trendDictionary.get([nicheId, normalizedKey])
  );
  if (cached) return cached;

  const fromSb = await sbGetTrendByKey(nicheId, normalizedKey);
  if (fromSb) {
    await tryCache((c) => c.trendDictionary.put(fromSb));
  }
  return fromSb;
};

export const putTrend = async (trend: TrendItem): Promise<void> => {
  await sbPutTrend(trend);
  await tryCache((c) => c.trendDictionary.put(trend));
};

export const getTrendsForNiche = async (
  nicheId: number
): Promise<TrendItem[]> => {
  // Cache-first by niche. We can't tell from the cache alone whether it's
  // complete (writes-through ensure new ones land here, but cross-device
  // fetches won't). For single-user app: if cache has any rows for the
  // niche, trust it; otherwise pull from Supabase and populate.
  const cached = await tryCache(async (c) =>
    c.trendDictionary.where('nicheId').equals(nicheId).toArray()
  );
  if (cached && cached.length > 0) return cached;

  const fromSb = await sbGetTrendsForNiche(nicheId);
  if (fromSb.length > 0) {
    await tryCache((c) => c.trendDictionary.bulkPut(fromSb));
  }
  return fromSb;
};

export const countTrendsForNiche = async (nicheId: number): Promise<number> => {
  const cached = await tryCache((c) =>
    c.trendDictionary.where('nicheId').equals(nicheId).count()
  );
  if (typeof cached === 'number' && cached > 0) return cached;

  const { count, error } = await sb()
    .from('trend_dictionary')
    .select('*', { count: 'exact', head: true })
    .eq('niche_id', nicheId);
  if (error) throw error;
  return count ?? 0;
};

/** Soft-cap LRU eviction: drop oldest-by-last_seen_at until ≤ SOFT_CAP_PER_NICHE.
 *  Runs against Supabase (source of truth); cache is then updated with the
 *  evicted set. */
export const enforceTrendSoftCap = async (nicheId: number): Promise<void> => {
  // Use Supabase count rather than cache, since cache might be incomplete.
  const { count, error: countErr } = await sb()
    .from('trend_dictionary')
    .select('*', { count: 'exact', head: true })
    .eq('niche_id', nicheId);
  if (countErr) throw countErr;
  const total = count ?? 0;
  if (total <= SOFT_CAP_PER_NICHE) return;
  const overflow = total - SOFT_CAP_PER_NICHE;

  const { data, error } = await sb()
    .from('trend_dictionary')
    .select('niche_id, normalized_key')
    .eq('niche_id', nicheId)
    .order('last_seen_at', { ascending: true })
    .limit(overflow);
  if (error) throw error;
  if (!data || data.length === 0) return;

  for (const row of data) {
    const { error: delErr } = await sb()
      .from('trend_dictionary')
      .delete()
      .eq('niche_id', row.niche_id)
      .eq('normalized_key', row.normalized_key);
    if (delErr) throw delErr;
    await tryCache((c) =>
      c.trendDictionary.delete([row.niche_id, row.normalized_key] as [number, string])
    );
  }
};

// ─── Niche trend meta ───────────────────────────────────────────────────────

const metaRowToItem = (row: any): NicheTrendMeta => ({
  nicheId: row.niche_id,
  lastFetchedAt: toDate(row.last_fetched_at),
  viewCursor: row.view_cursor ?? 0,
  pageSize: row.page_size ?? 10,
});

const sbGetNicheTrendMeta = async (
  nicheId: number
): Promise<NicheTrendMeta | undefined> => {
  const { data, error } = await sb()
    .from('niche_trend_meta')
    .select('*')
    .eq('niche_id', nicheId)
    .maybeSingle();
  if (error) throw error;
  return data ? metaRowToItem(data) : undefined;
};

const sbPutNicheTrendMeta = async (meta: NicheTrendMeta): Promise<void> => {
  const { error } = await sb()
    .from('niche_trend_meta')
    .upsert({
      niche_id: meta.nicheId,
      last_fetched_at: meta.lastFetchedAt.toISOString(),
      view_cursor: meta.viewCursor,
      page_size: meta.pageSize,
    });
  if (error) throw error;
};

export const getNicheTrendMeta = async (
  nicheId: number
): Promise<NicheTrendMeta | undefined> => {
  const cached = await tryCache((c) => c.nicheTrendMeta.get(nicheId));
  if (cached) return cached;

  const fromSb = await sbGetNicheTrendMeta(nicheId);
  if (fromSb) {
    await tryCache((c) => c.nicheTrendMeta.put(fromSb));
  }
  return fromSb;
};

export const putNicheTrendMeta = async (meta: NicheTrendMeta): Promise<void> => {
  await sbPutNicheTrendMeta(meta);
  await tryCache((c) => c.nicheTrendMeta.put(meta));
};

// ─── Content ideas cache ────────────────────────────────────────────────────

const ideasRowToItem = (row: any): ContentIdeasCacheRow => ({
  cacheKey: row.cache_key,
  nicheIds: row.niche_ids ?? [],
  platforms: row.platforms ?? [],
  ideas: row.ideas ?? [],
  trendTitlesUsed: row.trend_titles_used ?? [],
  generatedAt: toDate(row.generated_at),
  expiresAt: toDate(row.expires_at),
});

const sbGetContentIdeasCache = async (
  cacheKey: string
): Promise<ContentIdeasCacheRow | undefined> => {
  const { data, error } = await sb()
    .from('content_ideas_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .maybeSingle();
  if (error) throw error;
  return data ? ideasRowToItem(data) : undefined;
};

const sbPutContentIdeasCache = async (
  row: ContentIdeasCacheRow
): Promise<void> => {
  const { error } = await sb()
    .from('content_ideas_cache')
    .upsert({
      cache_key: row.cacheKey,
      niche_ids: row.nicheIds,
      platforms: row.platforms,
      ideas: row.ideas,
      trend_titles_used: row.trendTitlesUsed,
      generated_at: row.generatedAt.toISOString(),
      expires_at: row.expiresAt.toISOString(),
    });
  if (error) throw error;
};

export const getContentIdeasCache = async (
  cacheKey: string
): Promise<ContentIdeasCacheRow | undefined> => {
  const cached = await tryCache((c) => c.contentIdeasCache.get(cacheKey));
  if (cached && cached.expiresAt > new Date()) return cached;

  const fromSb = await sbGetContentIdeasCache(cacheKey);
  if (fromSb) {
    await tryCache((c) => c.contentIdeasCache.put(fromSb));
  }
  return fromSb;
};

export const putContentIdeasCache = async (
  row: ContentIdeasCacheRow
): Promise<void> => {
  await sbPutContentIdeasCache(row);
  await tryCache((c) => c.contentIdeasCache.put(row));
};

/**
 * Read all non-expired content-ideas cache rows. Used by the per-niche
 * fallback in IdeaService.getIdeas — when an exact-key lookup misses
 * (e.g. user has dropped/added a niche since the row was written), we
 * scan rows and surface ideas whose `niche.id` is in the current set.
 */
export const getAllContentIdeasCaches = async (): Promise<ContentIdeasCacheRow[]> => {
  const cached = await tryCache(async (c) => {
    const now = new Date();
    return c.contentIdeasCache.filter((r) => r.expiresAt > now).toArray();
  });
  if (cached && cached.length > 0) return cached;

  const nowIso = new Date().toISOString();
  const { data, error } = await sb()
    .from('content_ideas_cache')
    .select('*')
    .gt('expires_at', nowIso);
  if (error) throw error;
  const rows = (data ?? []).map(ideasRowToItem);

  await tryCache(async (c) => {
    if (rows.length > 0) await c.contentIdeasCache.bulkPut(rows);
  });
  return rows;
};

export const clearExpiredContentIdeasCaches = async (): Promise<void> => {
  const nowIso = new Date().toISOString();
  const { error } = await sb()
    .from('content_ideas_cache')
    .delete()
    .lt('expires_at', nowIso);
  if (error) throw error;

  await tryCache(async (c) => {
    const now = new Date();
    const expired = await c.contentIdeasCache
      .filter((r) => r.expiresAt < now)
      .toArray();
    if (expired.length > 0) {
      await c.contentIdeasCache.bulkDelete(expired.map((r) => r.cacheKey));
    }
  });
};
