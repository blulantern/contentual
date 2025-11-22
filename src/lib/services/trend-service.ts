import { AIService } from '../ai/ai-service';
import { TrendItem, ContentIdea } from '@/types/trends';
import { SocialPlatform } from '@/types/platforms';
import {
  analyzeTrendsPrompt,
  generateContentIdeasPrompt,
  SYSTEM_PROMPTS,
} from '../ai/prompts';
import { saveTrends, saveContentIdeas } from '../storage/db';
import { NICHE_CATEGORIES } from '../data/niche-categories';

export class TrendService {
  constructor(private aiService: AIService) {}

  async fetchTrends(niches: string[], platforms: SocialPlatform[]): Promise<TrendItem[]> {
    const prompt = analyzeTrendsPrompt(niches, platforms);

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

    const trends: TrendItem[] = parsed.trends.map((trend: any) => {
      const nicheCategory = NICHE_CATEGORIES.find((n) => n.name === trend.niche);
      return {
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
      };
    });

    await saveTrends(trends);
    return trends;
  }

  async generateContentIdeas(
    niches: string[],
    platforms: SocialPlatform[],
    trends: string[] = []
  ): Promise<ContentIdea[]> {
    const prompt = generateContentIdeasPrompt(niches, platforms, trends);

    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'content-ideas',
      systemPrompt: SYSTEM_PROMPTS.contentStrategy,
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
      console.error('Failed to parse content ideas JSON:', jsonContent);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const ideas: ContentIdea[] = parsed.ideas.map((idea: any) => {
      const nicheCategory = NICHE_CATEGORIES.find((n) => n.name === idea.niche);
      return {
        id: crypto.randomUUID(),
        title: idea.title,
        description: idea.description,
        niche: nicheCategory || NICHE_CATEGORIES[0],
        difficulty: idea.difficulty,
        timeEstimate: idea.timeEstimate,
        equipment: idea.equipment,
        platforms: idea.platforms,
        steps: idea.steps,
        relatedTrends: [],
      };
    });

    await saveContentIdeas(ideas);
    return ideas;
  }
}
