import { AIService } from '../ai/ai-service';
import { TrendItem } from '@/types/trends';
import { SocialPlatform } from '@/types/platforms';
import { analyzeTrendsPrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import { getTrendCache, saveTrendCache, clearExpiredCaches, TrendCache } from '../storage/db';
import { NICHE_CATEGORIES } from '../data/niche-categories';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class TrendCacheService {
  constructor(private aiService: AIService) {}

  /**
   * Get trends for a specific niche (from cache or fetch fresh)
   */
  async getTrendsForNiche(
    nicheName: string,
    platforms: SocialPlatform[],
    forceRefresh: boolean = false
  ): Promise<TrendItem[]> {
    const nicheCategory = NICHE_CATEGORIES.find((n) => n.name === nicheName);
    if (!nicheCategory) {
      throw new Error(`Niche not found: ${nicheName}`);
    }

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = await getTrendCache(nicheCategory.id.toString());
      if (cached && cached.expiresAt > new Date()) {
        console.log(`Using cached trends for ${nicheName}`);
        return cached.trends;
      }
    }

    // Fetch fresh trends
    console.log(`Fetching fresh trends for ${nicheName}`);
    const trends = await this.fetchTrendsForNiche(nicheName, platforms);

    // Cache the results
    const cache: TrendCache = {
      id: nicheCategory.id.toString(),
      nicheName,
      trends,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
    };
    await saveTrendCache(cache);

    return trends;
  }

  /**
   * Fetch trends from AI for a specific niche
   */
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

    // Extract JSON from response
    let jsonContent = response.content.trim();
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (error) {
      console.error('Failed to parse trends JSON:', jsonContent);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const nicheCategory = NICHE_CATEGORIES.find((n) => n.name === nicheName);

    const trends: TrendItem[] = parsed.trends.map((trend: any) => ({
      id: crypto.randomUUID(),
      title: trend.title,
      description: trend.description,
      niche: nicheCategory || NICHE_CATEGORIES[0],
      platforms: trend.platforms,
      trendingScore: trend.trendingScore,
      hashtags: trend.hashtags,
      audioTrack: trend.audioTrack,
      exampleLinks: trend.exampleCreators || [],
      dateAdded: new Date(),
      lastUpdated: new Date(),
    }));

    return trends;
  }

  /**
   * Pre-fetch trends for all user niches in background
   */
  async prefetchAllNicheTrends(
    nicheNames: string[],
    platforms: SocialPlatform[]
  ): Promise<void> {
    console.log(`Pre-fetching trends for ${nicheNames.length} niches`);

    // Clear expired caches first
    await clearExpiredCaches();

    // Fetch trends for each niche in sequence (to avoid rate limits)
    for (const nicheName of nicheNames) {
      try {
        await this.getTrendsForNiche(nicheName, platforms);
        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to pre-fetch trends for ${nicheName}:`, error);
        // Continue with other niches even if one fails
      }
    }

    console.log('Pre-fetch complete');
  }

  /**
   * Get trends for multiple niches (from cache when available)
   */
  async getTrendsForNiches(
    nicheNames: string[],
    platforms: SocialPlatform[],
    forceRefresh: boolean = false
  ): Promise<TrendItem[]> {
    const allTrends: TrendItem[] = [];

    for (const nicheName of nicheNames) {
      try {
        const trends = await this.getTrendsForNiche(nicheName, platforms, forceRefresh);
        allTrends.push(...trends);
      } catch (error) {
        console.error(`Failed to get trends for ${nicheName}:`, error);
      }
    }

    // Sort by trending score
    return allTrends.sort((a, b) => b.trendingScore - a.trendingScore);
  }

  /**
   * Check if cache exists and is valid for given niches
   */
  async hasFreshCache(nicheNames: string[]): Promise<boolean> {
    for (const nicheName of nicheNames) {
      const nicheCategory = NICHE_CATEGORIES.find((n) => n.name === nicheName);
      if (!nicheCategory) continue;

      const cached = await getTrendCache(nicheCategory.id.toString());
      if (!cached || cached.expiresAt <= new Date()) {
        return false;
      }
    }
    return nicheNames.length > 0;
  }
}
