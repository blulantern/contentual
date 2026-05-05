import { AIService } from '../ai/ai-service';
import { ContentIdea, ContentIdeasCacheRow } from '@/types/trends';
import { SocialPlatform } from '@/types/platforms';
import { generateContentIdeasPrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import { getContentIdeasCache, putContentIdeasCache } from '../storage/db';
import { NICHE_CATEGORIES, getNicheByName } from '../data/niche-categories';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TOP_TREND_TITLE_COUNT = 5;
const STALE_DIVERGENCE_THRESHOLD = 2;

const sha256Hex = async (s: string): Promise<string> => {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const cacheKeyFor = async (
  nicheIds: number[],
  platforms: SocialPlatform[]
): Promise<string> => {
  const sortedNiches = [...nicheIds].sort((a, b) => a - b).join(',');
  const sortedPlatforms = [...platforms].sort().join(',');
  return await sha256Hex(`${sortedNiches}|${sortedPlatforms}`);
};

const trendTitlesDivergence = (a: string[], b: string[]): number => {
  const set = new Set(b);
  let differ = 0;
  for (const t of a) if (!set.has(t)) differ++;
  return differ;
};

export type IdeaIntent = 'view' | 'regenerate';

export interface IdeaResult {
  ideas: ContentIdea[];
  fromCache: boolean;
  staleVsCurrentTrends: boolean;
}

export class IdeaService {
  constructor(private aiService: AIService) {}

  async getIdeas(
    nicheNames: string[],
    platforms: SocialPlatform[],
    trendTitles: string[],
    intent: IdeaIntent
  ): Promise<IdeaResult> {
    const nicheIds = nicheNames
      .map((n) => getNicheByName(n)?.id)
      .filter((x): x is number => typeof x === 'number');

    const key = await cacheKeyFor(nicheIds, platforms);
    const trimmedTitles = trendTitles.slice(0, TOP_TREND_TITLE_COUNT);

    if (intent === 'view') {
      const cached = await getContentIdeasCache(key);
      if (cached && cached.expiresAt > new Date()) {
        const stale =
          trendTitlesDivergence(cached.trendTitlesUsed, trimmedTitles) >
          STALE_DIVERGENCE_THRESHOLD;
        return {
          ideas: cached.ideas,
          fromCache: true,
          staleVsCurrentTrends: stale,
        };
      }
    }

    const fresh = await this.fetchIdeas(nicheNames, platforms, trimmedTitles);
    const now = new Date();
    const row: ContentIdeasCacheRow = {
      cacheKey: key,
      nicheIds,
      platforms,
      ideas: fresh,
      trendTitlesUsed: trimmedTitles,
      generatedAt: now,
      expiresAt: new Date(now.getTime() + TWENTY_FOUR_HOURS_MS),
    };
    await putContentIdeasCache(row);

    return { ideas: fresh, fromCache: false, staleVsCurrentTrends: false };
  }

  private async fetchIdeas(
    nicheNames: string[],
    platforms: SocialPlatform[],
    trendTitles: string[]
  ): Promise<ContentIdea[]> {
    const prompt = generateContentIdeasPrompt(nicheNames, platforms, trendTitles);
    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'content-ideas',
      systemPrompt: SYSTEM_PROMPTS.contentStrategy,
      maxTokens: 8192,
    });
    return parseIdeasContent(response.content);
  }
}

/**
 * Parse a raw content-ideas JSON-or-fenced response into ContentIdea[].
 * Reused by SeedingService to import fixture responses without re-running
 * the AI.
 */
export const parseIdeasContent = (rawContent: string): ContentIdea[] => {
  let jsonContent = rawContent.trim();
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) jsonContent = jsonMatch[0];

  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    console.error('Failed to parse content ideas JSON:', jsonContent);
    throw new Error('Content-ideas response is not valid JSON.');
  }

  return (parsed.ideas || []).map((idea: any): ContentIdea => {
    const niche = NICHE_CATEGORIES.find((n) => n.name === idea.niche);
    return {
      id: crypto.randomUUID(),
      title: String(idea.title ?? ''),
      description: String(idea.description ?? ''),
      niche: niche || NICHE_CATEGORIES[0],
      difficulty: (idea.difficulty || 'beginner') as ContentIdea['difficulty'],
      timeEstimate: Number(idea.timeEstimate) || 0,
      equipment: Array.isArray(idea.equipment) ? idea.equipment : [],
      platforms: Array.isArray(idea.platforms) ? idea.platforms : [],
      steps: Array.isArray(idea.steps) ? idea.steps : [],
      relatedTrends: Array.isArray(idea.relatedTrends) ? idea.relatedTrends : [],
    };
  });
};

export const ideasCacheKeyFor = async (
  nicheIds: number[],
  platforms: SocialPlatform[]
): Promise<string> => cacheKeyFor(nicheIds, platforms);
