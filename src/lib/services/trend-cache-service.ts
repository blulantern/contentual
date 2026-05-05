import { AIService } from '../ai/ai-service';
import {
  TrendItem,
  NicheTrendMeta,
  HashtagRef,
  ExternalCreatorRef,
} from '@/types/trends';
import { SocialPlatform } from '@/types/platforms';
import { analyzeTrendsPrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import {
  db,
  getNicheTrendMeta,
  putNicheTrendMeta,
  countTrendsForNiche,
  enforceTrendSoftCap,
} from '../storage/db';
import {
  NICHE_CATEGORIES,
  getNicheById,
  getNicheByName,
} from '../data/niche-categories';
import { normalizeTrendTitle } from './trend-normalize';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_VIEW_PAGE_SIZE = 10;

/** Module-scoped per-niche serialization. Prevents cursor/fetch races. */
const inFlightByNiche = new Map<number, Promise<unknown>>();

const withNicheLock = async <T>(
  nicheId: number,
  fn: () => Promise<T>
): Promise<T> => {
  const prev = inFlightByNiche.get(nicheId);
  const next = (async () => {
    if (prev) {
      try {
        await prev;
      } catch {
        /* prior failure shouldn't block subsequent ops */
      }
    }
    return fn();
  })();
  inFlightByNiche.set(nicheId, next);
  try {
    return await next;
  } finally {
    if (inFlightByNiche.get(nicheId) === next) {
      inFlightByNiche.delete(nicheId);
    }
  }
};

export type RegenerateSource = 'fresh' | 'cycled';

export interface RegenerateResult {
  trends: TrendItem[];
  source: RegenerateSource;
  /** Earliest moment a fresh fetch will be allowed across rate-limited niches. */
  nextFreshAt: Date;
  /** True only when every rate-limited niche wrapped its cursor this round. */
  cycledAroundCompleteSet: boolean;
  /** Per-niche detail for richer UI feedback. */
  perNiche: Array<{
    nicheId: number;
    source: RegenerateSource;
    cycledAroundCompleteSet: boolean;
    lastFetchedAt: Date;
  }>;
}

export class TrendDictionaryService {
  constructor(private aiService: AIService) {}

  /**
   * Pure read: assembles the current view across nicheIds.
   * Each niche contributes pageSize items starting at its viewCursor.
   * Cross-niche order: lastSeenAt DESC, trendingScore DESC.
   * Legacy records (hashtags/exampleLinks stored as bare string[]) are
   * coerced to HashtagRef[] / ExternalCreatorRef[] on the way out.
   */
  async getView(nicheIds: number[]): Promise<TrendItem[]> {
    const collected: TrendItem[] = [];
    for (const nicheId of nicheIds) {
      const rows = await db.trendDictionary
        .where('nicheId')
        .equals(nicheId)
        .toArray();
      if (rows.length === 0) continue;
      rows.sort(byLastSeenThenScore);
      const meta = await getNicheTrendMeta(nicheId);
      const pageSize = meta?.pageSize ?? DEFAULT_VIEW_PAGE_SIZE;
      const cursor = meta?.viewCursor ?? 0;
      const slice = rows.slice(cursor, cursor + pageSize);
      const page = slice.length > 0 ? slice : rows.slice(0, pageSize);
      collected.push(...page.map(normalizeTrendForView));
    }
    collected.sort(byLastSeenThenScore);
    return collected;
  }

  /**
   * User-triggered Regenerate. Per niche: fresh fetch if ≥ 3h since
   * lastFetchedAt, otherwise advance cursor through the cached dict.
   */
  async regenerate(
    nicheNames: string[],
    platforms: SocialPlatform[]
  ): Promise<RegenerateResult> {
    const nicheIds = nicheNames
      .map((n) => getNicheByName(n)?.id)
      .filter((x): x is number => typeof x === 'number');

    const perNiche = await Promise.all(
      nicheIds.map((id) => this.regenerateNiche(id, platforms))
    );

    const anyFresh = perNiche.some((r) => r.source === 'fresh');
    const allCycled = perNiche.length > 0 && perNiche.every((r) => r.source === 'cycled');
    const allWrapped = perNiche.every(
      (r) => r.source !== 'cycled' || r.cycledAroundCompleteSet
    );

    const cycledLastFetches = perNiche
      .filter((r) => r.source === 'cycled')
      .map((r) => r.lastFetchedAt.getTime() + THREE_HOURS_MS);
    const nextFreshAt =
      cycledLastFetches.length > 0
        ? new Date(Math.min(...cycledLastFetches))
        : new Date();

    const trends = await this.getView(nicheIds);

    return {
      trends,
      source: anyFresh ? 'fresh' : 'cycled',
      nextFreshAt,
      cycledAroundCompleteSet: allCycled && allWrapped,
      perNiche,
    };
  }

  /**
   * Background scheduler hook: refresh niches with lastFetchedAt > 24h.
   * Sequential with 1s spacing to spread token spend. Failures are warned, not thrown.
   */
  async refreshIfStale(
    nicheNames: string[],
    platforms: SocialPlatform[]
  ): Promise<void> {
    const nicheIds = nicheNames
      .map((n) => getNicheByName(n)?.id)
      .filter((x): x is number => typeof x === 'number');

    const now = Date.now();
    for (const nicheId of nicheIds) {
      const meta = await getNicheTrendMeta(nicheId);
      const last = meta?.lastFetchedAt?.getTime() ?? 0;
      if (now - last <= TWENTY_FOUR_HOURS_MS) continue;
      if (inFlightByNiche.has(nicheId)) continue;
      try {
        await this.regenerateNiche(nicheId, platforms);
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.warn(`[trends] refreshIfStale failed for niche ${nicheId}:`, err);
      }
    }
  }

  // ─── private ──────────────────────────────────────────────────────────────

  private async regenerateNiche(
    nicheId: number,
    platforms: SocialPlatform[]
  ): Promise<{
    nicheId: number;
    source: RegenerateSource;
    cycledAroundCompleteSet: boolean;
    lastFetchedAt: Date;
  }> {
    return withNicheLock(nicheId, async () => {
      const now = new Date();
      const meta: NicheTrendMeta =
        (await getNicheTrendMeta(nicheId)) ?? {
          nicheId,
          lastFetchedAt: new Date(0),
          viewCursor: 0,
          pageSize: DEFAULT_PAGE_SIZE,
        };

      const sinceLast = now.getTime() - meta.lastFetchedAt.getTime();

      if (sinceLast >= THREE_HOURS_MS) {
        const niche = getNicheById(nicheId);
        if (!niche) {
          throw new Error(`Unknown niche id: ${nicheId}`);
        }
        const fetched = await this.fetchTrendsForNiche(niche.name, platforms);

        await db.transaction('rw', db.trendDictionary, db.nicheTrendMeta, async () => {
          for (const trend of fetched) {
            const key = normalizeTrendTitle(trend.title);
            if (!key) continue;
            const existing = await db.trendDictionary.get([nicheId, key]);
            if (existing) {
              const normalizedExisting = normalizeTrendForView(existing);
              await db.trendDictionary.put({
                ...existing,
                lastSeenAt: now,
                trendingScore: Math.max(existing.trendingScore, trend.trendingScore),
                hashtags: mergeHashtags(normalizedExisting.hashtags, trend.hashtags),
                exampleLinks: mergeCreators(
                  normalizedExisting.exampleLinks,
                  trend.exampleLinks
                ),
                description:
                  trend.description.length > existing.description.length
                    ? trend.description
                    : existing.description,
                audioTrack: existing.audioTrack || trend.audioTrack,
                platforms: dedupe([...existing.platforms, ...trend.platforms]) as TrendItem['platforms'],
              });
            } else {
              await db.trendDictionary.put({
                ...trend,
                nicheId,
                niche,
                normalizedKey: key,
                firstSeenAt: now,
                lastSeenAt: now,
              });
            }
          }
          await db.nicheTrendMeta.put({
            ...meta,
            lastFetchedAt: now,
            viewCursor: 0,
          });
        });

        await enforceTrendSoftCap(nicheId);

        return {
          nicheId,
          source: 'fresh' as const,
          cycledAroundCompleteSet: false,
          lastFetchedAt: now,
        };
      }

      // rate-limited: advance cursor, wrap if past end
      const total = await countTrendsForNiche(nicheId);
      const advanced = meta.viewCursor + meta.pageSize;
      let newCursor = advanced;
      let wrapped = false;
      if (total > 0 && advanced >= total) {
        newCursor = 0;
        wrapped = true;
      }
      await putNicheTrendMeta({ ...meta, viewCursor: newCursor });
      return {
        nicheId,
        source: 'cycled' as const,
        cycledAroundCompleteSet: wrapped,
        lastFetchedAt: meta.lastFetchedAt,
      };
    });
  }

  private async fetchTrendsForNiche(
    nicheName: string,
    platforms: SocialPlatform[]
  ): Promise<TrendItem[]> {
    const prompt = analyzeTrendsPrompt([nicheName], platforms);
    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'trend-analysis',
      systemPrompt: SYSTEM_PROMPTS.trendAnalysis,
      maxTokens: 8192,
    });

    let jsonContent = response.content.trim();
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonContent = jsonMatch[0];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse trends JSON:', jsonContent);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const niche = NICHE_CATEGORIES.find((n) => n.name === nicheName);
    const now = new Date();

    return (parsed.trends || []).map((trend: any): TrendItem => {
      const trendPlatforms: SocialPlatform[] = sanitizePlatforms(trend.platforms, []);
      const fallbackPlatforms = trendPlatforms.length > 0 ? trendPlatforms : platforms;
      return {
        id: crypto.randomUUID(),
        normalizedKey: '', // re-derived on merge
        nicheId: niche?.id ?? 0,
        niche: niche || NICHE_CATEGORIES[0],
        title: String(trend.title ?? ''),
        description: String(trend.description ?? ''),
        platforms: trendPlatforms.length > 0 ? trendPlatforms : platforms,
        trendingScore: Number(trend.trendingScore) || 0,
        hashtags: (Array.isArray(trend.hashtags) ? trend.hashtags : [])
          .map((h: any) => coerceHashtag(h, fallbackPlatforms))
          .filter((h: HashtagRef | null): h is HashtagRef => h !== null),
        audioTrack: trend.audioTrack || undefined,
        exampleLinks: (Array.isArray(trend.exampleCreators) ? trend.exampleCreators : [])
          .map((c: any) => coerceCreatorRef(c, fallbackPlatforms))
          .filter((c: ExternalCreatorRef | null): c is ExternalCreatorRef => c !== null),
        firstSeenAt: now,
        lastSeenAt: now,
      };
    });
  }
}

const byLastSeenThenScore = (a: TrendItem, b: TrendItem): number => {
  const t = b.lastSeenAt.getTime() - a.lastSeenAt.getTime();
  if (t !== 0) return t;
  return b.trendingScore - a.trendingScore;
};

const dedupe = <T>(arr: T[]): T[] => Array.from(new Set(arr));

// ─── Coercion helpers ───────────────────────────────────────────────────────
// Tolerate: (a) the new structured shape from the updated AI prompt,
// (b) the legacy bare-string shape stored before this change.

const VALID_PLATFORMS: ReadonlySet<SocialPlatform> = new Set([
  'tiktok',
  'instagram',
  'youtube',
  'twitter',
]);

const isValidPlatform = (p: any): p is SocialPlatform =>
  typeof p === 'string' && VALID_PLATFORMS.has(p as SocialPlatform);

const sanitizePlatforms = (
  input: any,
  fallback: SocialPlatform[]
): SocialPlatform[] => {
  if (!Array.isArray(input)) return fallback;
  const out: SocialPlatform[] = [];
  const seen = new Set<SocialPlatform>();
  for (const v of input) {
    if (isValidPlatform(v) && !seen.has(v)) {
      out.push(v);
      seen.add(v);
    }
  }
  return out.length > 0 ? out : fallback;
};

const coerceHashtag = (
  input: any,
  fallback: SocialPlatform[]
): HashtagRef | null => {
  if (input == null) return null;
  if (typeof input === 'string') {
    const tag = input.trim();
    if (!tag) return null;
    return { tag, platforms: fallback.length > 0 ? fallback : [] };
  }
  if (typeof input === 'object' && typeof input.tag === 'string') {
    const tag = input.tag.trim();
    if (!tag) return null;
    return { tag, platforms: sanitizePlatforms(input.platforms, fallback) };
  }
  return null;
};

const coerceCreatorRef = (
  input: any,
  fallback: SocialPlatform[]
): ExternalCreatorRef | null => {
  if (input == null) return null;
  if (typeof input === 'string') {
    const handle = input.trim();
    if (!handle) return null;
    return { handle, platforms: fallback.length > 0 ? fallback : [] };
  }
  if (typeof input === 'object' && typeof input.handle === 'string') {
    const handle = input.handle.trim();
    if (!handle) return null;
    return {
      handle,
      platforms: sanitizePlatforms(input.platforms, fallback),
    };
  }
  return null;
};

const mergeHashtags = (
  existing: HashtagRef[],
  incoming: HashtagRef[]
): HashtagRef[] => {
  const byTag = new Map<string, HashtagRef>();
  for (const ref of [...existing, ...incoming]) {
    const key = ref.tag.toLowerCase().replace(/^#/, '');
    const prior = byTag.get(key);
    if (prior) {
      const platforms = Array.from(new Set([...prior.platforms, ...ref.platforms]));
      byTag.set(key, { tag: prior.tag, platforms });
    } else {
      byTag.set(key, { tag: ref.tag, platforms: [...ref.platforms] });
    }
  }
  return Array.from(byTag.values());
};

const mergeCreators = (
  existing: ExternalCreatorRef[],
  incoming: ExternalCreatorRef[]
): ExternalCreatorRef[] => {
  const byHandle = new Map<string, ExternalCreatorRef>();
  for (const ref of [...existing, ...incoming]) {
    const key = ref.handle.toLowerCase().replace(/^@/, '');
    const prior = byHandle.get(key);
    if (prior) {
      const platforms = Array.from(new Set([...prior.platforms, ...ref.platforms]));
      byHandle.set(key, { handle: prior.handle, platforms });
    } else {
      byHandle.set(key, { handle: ref.handle, platforms: [...ref.platforms] });
    }
  }
  return Array.from(byHandle.values());
};

/** Normalize a stored TrendItem so callers always see the canonical shape. */
const normalizeTrendForView = (raw: any): TrendItem => {
  const trendPlatforms: SocialPlatform[] = sanitizePlatforms(raw.platforms, []);
  const fallback = trendPlatforms.length > 0 ? trendPlatforms : [];
  return {
    ...raw,
    platforms: trendPlatforms,
    hashtags: (Array.isArray(raw.hashtags) ? raw.hashtags : [])
      .map((h: any) => coerceHashtag(h, fallback))
      .filter((h: HashtagRef | null): h is HashtagRef => h !== null),
    exampleLinks: (Array.isArray(raw.exampleLinks) ? raw.exampleLinks : [])
      .map((c: any) => coerceCreatorRef(c, fallback))
      .filter((c: ExternalCreatorRef | null): c is ExternalCreatorRef => c !== null),
  };
};
