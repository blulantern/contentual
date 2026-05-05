/**
 * Seed Supabase + IndexedDB cache from local AI fixtures so the user
 * doesn't have to run through the setup wizard.
 *
 * Pulls fixtures from `fixtures/ai/*.json` (via the dev API route) plus
 * any localStorage-cached fixtures, classifies each by `cacheKey` and the
 * shape of its prompt, and writes through the same persistence layer the
 * normal app flow uses. No AI calls.
 *
 * Single-user app: this overwrites the current profile / appends to trends.
 */

import { AIService } from '../ai/ai-service';
import { listAllFromDisk, listFixtures, FixtureRecord } from '../ai/fixture-store';
import { saveProfile, putContentIdeasCache } from '../storage/db';
import {
  TrendDictionaryService,
  parseTrendsContent,
} from './trend-cache-service';
import { parseIdeasContent, ideasCacheKeyFor } from './idea-service';
import { applyCompatibilityScores } from './niche-compatibility';
import {
  NICHE_CATEGORIES,
  getNicheById,
  getNicheByName,
} from '../data/niche-categories';
import type {
  CreatorProfile,
  CreatorSurvey,
  Influencer,
  NicheMatch,
  SimilarCreator,
  TopInfluencer,
} from '@/types/profile';
import type {
  PlatformConnection,
  SocialPlatform,
} from '@/types/platforms';

const VALID_PLATFORMS = new Set<SocialPlatform>([
  'tiktok',
  'instagram',
  'youtube',
  'twitter',
]);

// ─── Fixture inventory ──────────────────────────────────────────────────────

interface ClassifiedFixture {
  hash: string;
  record: FixtureRecord;
  kind: 'profile-gen' | 'niche-creators' | 'trend-analysis' | 'content-ideas' | 'unknown';
}

const classify = (rec: FixtureRecord): ClassifiedFixture['kind'] => {
  const ck = rec.cacheKey;
  const head = rec.prompt.slice(0, 200);
  if (ck === 'profile-analysis') {
    if (/^Create a comprehensive content creator profile/i.test(head)) {
      return 'profile-gen';
    }
    if (/^List well-known content creators/i.test(head)) {
      return 'niche-creators';
    }
    return 'unknown';
  }
  if (ck === 'trend-analysis') return 'trend-analysis';
  if (ck === 'content-ideas') return 'content-ideas';
  return 'unknown';
};

export interface FixtureInventory {
  profileGen: number;
  nicheCreators: number;
  trendAnalysis: number;
  contentIdeas: number;
  total: number;
}

export interface SeedResult {
  profileImported: boolean;
  nicheCreatorGroupsImported: number;
  trendsImportedByNiche: Record<string, number>;
  ideasCacheRowsWritten: number;
  warnings: string[];
}

const loadAllClassified = async (): Promise<ClassifiedFixture[]> => {
  // Prefer disk (canonical); fall back to localStorage.
  const disk = await listAllFromDisk();
  const local = listFixtures();
  const merged = { ...local, ...disk }; // disk wins on conflict
  return Object.entries(merged).map(([hash, record]) => ({
    hash,
    record,
    kind: classify(record),
  }));
};

export const inventoryFixtures = async (): Promise<FixtureInventory> => {
  const all = await loadAllClassified();
  return {
    profileGen: all.filter((c) => c.kind === 'profile-gen').length,
    nicheCreators: all.filter((c) => c.kind === 'niche-creators').length,
    trendAnalysis: all.filter((c) => c.kind === 'trend-analysis').length,
    contentIdeas: all.filter((c) => c.kind === 'content-ideas').length,
    total: all.length,
  };
};

// ─── Prompt parsing ─────────────────────────────────────────────────────────
// The fixtures' `prompt` field carries the only record of what platforms,
// niches, and survey were used to generate the response. Parse what we can
// from each known prompt format; missing fields fall back to defaults.

const extractPlatformsFromProfilePrompt = (prompt: string): PlatformConnection[] => {
  // PLATFORMS:
  // - tiktok: @user
  const platformsBlock = prompt.match(/PLATFORMS:\s*([\s\S]*?)(?:\n\n|\nGOALS|\nSURVEY|$)/i);
  if (!platformsBlock) return [];
  const lines = platformsBlock[1].split('\n');
  const out: PlatformConnection[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*-\s*(\w+)\s*:\s*@?(\S+)\s*$/);
    if (!m) continue;
    const platform = m[1].toLowerCase() as SocialPlatform;
    if (!VALID_PLATFORMS.has(platform)) continue;
    out.push({ platform, username: m[2], connected: true });
  }
  return out;
};

const matchLine = (prompt: string, label: string): string | undefined => {
  const re = new RegExp(`^\\s*-?\\s*${label}\\s*:\\s*(.+)$`, 'im');
  const m = prompt.match(re);
  return m ? m[1].trim() : undefined;
};

const parseList = (s: string): string[] =>
  s.split(',').map((x) => x.trim()).filter(Boolean);

const extractSurveyFromProfilePrompt = (prompt: string): CreatorSurvey => {
  // Recent posts is multi-line; grab block.
  const recentBlock = prompt.match(/Recent posts:\s*\n((?:\s*-\s*.+\n?)+)/i);
  const recentPostTitles = recentBlock
    ? recentBlock[1]
        .split('\n')
        .map((l) => l.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
    : [];

  const goals = matchLine(prompt, 'Goals') ?? '';
  const timeRaw = matchLine(prompt, 'Time') ?? '';
  const timeMatch = timeRaw.match(/(\d+)/);
  const timeCommitment = timeMatch ? parseInt(timeMatch[1], 10) : 10;
  const challenges = parseList(matchLine(prompt, 'Challenges') ?? '');
  const preferredFormats = parseList(matchLine(prompt, 'Formats') ?? '');
  const equipment = parseList(matchLine(prompt, 'Equipment') ?? '');
  const contentTopics = matchLine(prompt, 'Topics') ?? '';
  const audience = matchLine(prompt, 'Audience') ?? undefined;

  return {
    goals,
    timeCommitment,
    challenges,
    preferredFormats,
    equipment,
    contentTopics,
    recentPostTitles,
    audience: audience && audience !== '(none provided)' ? audience : undefined,
  };
};

const extractNicheFromTrendsPrompt = (prompt: string): string | undefined => {
  // "Analyze current social media trends for these niches: <name>[, <name>...]"
  const m = prompt.match(/trends for these niches:\s*([^\n]+)/i);
  if (!m) return undefined;
  // First niche name only (current code path is per-niche).
  return m[1].split(',')[0].trim();
};

const extractFromIdeasPrompt = (
  prompt: string
): { niches: string[]; platforms: SocialPlatform[]; trendTitles: string[] } => {
  const nichesLine = prompt.match(/content ideas for these niches:\s*([^\n]+)/i);
  const niches = nichesLine ? parseList(nichesLine[1]) : [];
  const platformsLine = prompt.match(/^\s*Platforms:\s*([^\n]+)/im);
  const platforms = platformsLine
    ? parseList(platformsLine[1]).filter((p): p is SocialPlatform =>
        VALID_PLATFORMS.has(p as SocialPlatform)
      )
    : [];
  const trendsLine = prompt.match(/Recent trends to incorporate:\s*([^\n]+)/i);
  const trendTitles = trendsLine ? parseList(trendsLine[1]) : [];
  return { niches, platforms, trendTitles };
};

const extractNicheFromCreatorsPrompt = (
  prompt: string
): { niche: string | undefined; platforms: SocialPlatform[] } => {
  const m = prompt.match(/the "([^"]+)" niche on these platforms:\s*([^\n.]+)/i);
  if (!m) return { niche: undefined, platforms: [] };
  return {
    niche: m[1],
    platforms: parseList(m[2]).filter((p): p is SocialPlatform =>
      VALID_PLATFORMS.has(p as SocialPlatform)
    ),
  };
};

// ─── Response parsers (specific to seeding paths) ───────────────────────────

const parseProfileGenContent = (rawContent: string): any => {
  let jsonContent = rawContent.trim();
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonContent = jsonMatch[0];
  return JSON.parse(jsonContent);
};

const parseNicheCreatorsContent = (
  rawContent: string,
  nicheName: string
): { topInfluencers: TopInfluencer; similarCreators: SimilarCreator[] } => {
  let jsonContent = rawContent.trim();
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonContent = jsonMatch[0];
  const parsed = JSON.parse(jsonContent);

  const influencers: Influencer[] = (parsed.influencers || [])
    .map((i: any) => ({
      name: String(i.name ?? ''),
      platform: i.platform as SocialPlatform,
      handle: String(i.handle ?? ''),
      followersRange: String(i.followersRange ?? ''),
      specialization: String(i.specialization ?? ''),
    }))
    .filter((i: Influencer) => i.name && i.handle);

  const similarCreators: SimilarCreator[] = (parsed.similarCreators || [])
    .map(
      (c: any): SimilarCreator => ({
        name: String(c.name ?? ''),
        platform: c.platform as SocialPlatform,
        handle: c.handle ? String(c.handle) : undefined,
        followerCount: String(c.followerCount ?? ''),
        niche: nicheName,
        keySuccessFactors: Array.isArray(c.keySuccessFactors)
          ? c.keySuccessFactors
          : [],
        contentStyle: String(c.contentStyle ?? ''),
      })
    )
    .filter((c: SimilarCreator) => c.name);

  return {
    topInfluencers: { niche: nicheName, influencers },
    similarCreators,
  };
};

// ─── Main entry point ───────────────────────────────────────────────────────

export class SeedingService {
  constructor(private aiService: AIService) {}

  async inventory(): Promise<FixtureInventory> {
    return inventoryFixtures();
  }

  async seed(): Promise<SeedResult> {
    const all = await loadAllClassified();
    const warnings: string[] = [];

    // 1. Profile (most recent profile-gen wins).
    const profileFixtures = all
      .filter((c) => c.kind === 'profile-gen')
      .sort((a, b) =>
        a.record.recordedAt < b.record.recordedAt ? 1 : -1
      );
    let profile: CreatorProfile | null = null;
    if (profileFixtures.length > 0) {
      try {
        profile = await this.seedProfile(profileFixtures[0].record);
      } catch (err) {
        warnings.push(`Profile import failed: ${(err as Error).message}`);
      }
    } else {
      warnings.push('No profile-generation fixture found.');
    }

    // 2. Per-niche creator fixtures (enrich profile.topInfluencers + similarCreators).
    let nicheCreatorGroupsImported = 0;
    if (profile) {
      const nicheCreatorFixtures = all.filter((c) => c.kind === 'niche-creators');
      for (const fx of nicheCreatorFixtures) {
        try {
          const updated = await this.seedNicheCreators(fx.record, profile);
          if (updated) {
            profile = updated;
            nicheCreatorGroupsImported++;
          }
        } catch (err) {
          warnings.push(
            `Niche-creators fixture ${fx.hash} skipped: ${(err as Error).message}`
          );
        }
      }
      // Persist enriched profile once at the end.
      if (nicheCreatorGroupsImported > 0) {
        await saveProfile({ ...profile, lastUpdated: new Date() });
      }
    }

    // 3. Trends — every trend-analysis fixture, merged into the dictionary.
    const trendsImportedByNiche: Record<string, number> = {};
    const trendService = new TrendDictionaryService(this.aiService);
    const trendFixtures = all.filter((c) => c.kind === 'trend-analysis');
    for (const fx of trendFixtures) {
      try {
        const niche = extractNicheFromTrendsPrompt(fx.record.prompt);
        if (!niche) {
          warnings.push(`Trend fixture ${fx.hash}: niche not parseable.`);
          continue;
        }
        if (!getNicheByName(niche)) {
          warnings.push(`Trend fixture ${fx.hash}: niche "${niche}" not in taxonomy.`);
          continue;
        }
        const platformsFromProfile =
          profile?.platforms.map((p) => p.platform) ??
          (['tiktok', 'instagram', 'youtube'] as SocialPlatform[]);
        const result = await trendService.seedFromRawTrendsResponse(
          niche,
          platformsFromProfile,
          fx.record.response.content
        );
        trendsImportedByNiche[niche] =
          (trendsImportedByNiche[niche] ?? 0) + result.merged;
      } catch (err) {
        warnings.push(
          `Trend fixture ${fx.hash} failed: ${(err as Error).message}`
        );
      }
    }

    // 4. Content ideas — write through to the cache table.
    let ideasCacheRowsWritten = 0;
    const ideasFixtures = all.filter((c) => c.kind === 'content-ideas');
    for (const fx of ideasFixtures) {
      try {
        const written = await this.seedIdeas(fx.record);
        if (written) ideasCacheRowsWritten++;
      } catch (err) {
        warnings.push(
          `Ideas fixture ${fx.hash} failed: ${(err as Error).message}`
        );
      }
    }

    return {
      profileImported: !!profile,
      nicheCreatorGroupsImported,
      trendsImportedByNiche,
      ideasCacheRowsWritten,
      warnings,
    };
  }

  private async seedProfile(rec: FixtureRecord): Promise<CreatorProfile> {
    const platforms = extractPlatformsFromProfilePrompt(rec.prompt);
    if (platforms.length === 0) {
      throw new Error('Could not parse PLATFORMS block from profile prompt.');
    }
    const survey = extractSurveyFromProfilePrompt(rec.prompt);
    const parsed = parseProfileGenContent(rec.response.content);

    const aiNiches: NicheMatch[] = (parsed.topNiches ?? [])
      .map((n: any) => {
        const cat = getNicheById(n.nicheId);
        return cat
          ? { ...cat, confidence: 0, reasoning: n.reasoning ?? '' }
          : { id: n.nicheId, name: n.nicheName, confidence: 0, reasoning: n.reasoning ?? '' };
      })
      .slice(0, 5);
    const topNiches = applyCompatibilityScores(aiNiches, survey);

    const profile: CreatorProfile = {
      id: crypto.randomUUID(),
      platforms,
      survey,
      topNiches,
      similarCreators: parsed.similarCreators ?? [],
      engagementStrategies: parsed.engagementStrategies ?? [],
      topInfluencers: parsed.topInfluencers ?? [],
      baselineProfile: parsed.baselineProfile,
      generatedAt: new Date(),
      lastUpdated: new Date(),
    };
    await saveProfile(profile);
    return profile;
  }

  private async seedNicheCreators(
    rec: FixtureRecord,
    profile: CreatorProfile
  ): Promise<CreatorProfile | null> {
    const { niche } = extractNicheFromCreatorsPrompt(rec.prompt);
    if (!niche) return null;
    const { topInfluencers, similarCreators } = parseNicheCreatorsContent(
      rec.response.content,
      niche
    );

    const filteredInfluencers = (profile.topInfluencers ?? []).filter(
      (g) => g.niche.toLowerCase() !== topInfluencers.niche.toLowerCase()
    );

    const dedupeKey = (c: SimilarCreator): string =>
      `${c.platform}:${c.name.toLowerCase()}`;
    const seen = new Set((profile.similarCreators ?? []).map(dedupeKey));
    const additions = similarCreators.filter((c) => {
      const k = dedupeKey(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      ...profile,
      topInfluencers: [...filteredInfluencers, topInfluencers],
      similarCreators: [...(profile.similarCreators ?? []), ...additions],
    };
  }

  private async seedIdeas(rec: FixtureRecord): Promise<boolean> {
    const ideas = parseIdeasContent(rec.response.content);
    if (ideas.length === 0) return false;
    const { niches, platforms, trendTitles } = extractFromIdeasPrompt(rec.prompt);
    const nicheIds = niches
      .map((n) => getNicheByName(n)?.id)
      .filter((x): x is number => typeof x === 'number');
    if (nicheIds.length === 0) {
      // Fall back to ALL niches in the taxonomy that match by lowercase
      // (rare path); without nicheIds the cache key is meaningless.
      throw new Error(
        `Ideas fixture: niches not in taxonomy (${niches.join(', ')}).`
      );
    }
    const cacheKey = await ideasCacheKeyFor(nicheIds, platforms);
    const now = new Date();
    await putContentIdeasCache({
      cacheKey,
      nicheIds,
      platforms,
      ideas,
      trendTitlesUsed: trendTitles.slice(0, 5),
      generatedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    return true;
  }
}

// re-export so callers can keep the dependency surface tight.
export { NICHE_CATEGORIES };
