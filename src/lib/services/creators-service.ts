import { AIService } from '../ai/ai-service';
import { generateCreatorsForNichePrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import type {
  Influencer,
  SimilarCreator,
  TopInfluencer,
} from '@/types/profile';
import { SocialPlatform } from '@/types/platforms';

export interface CreatorsForNiche {
  niche: string;
  influencers: Influencer[];
  similarCreators: SimilarCreator[];
}

/**
 * Single per-niche AI call that returns both well-known top influencers
 * (for the "Top creators in this niche" row) and 2-3 peer-level similar
 * creators (for the global Similar Creators section). One round-trip
 * keeps the manual-niche-add path cheap.
 */
export class CreatorsService {
  constructor(private aiService: AIService) {}

  async getCreatorsForNiche(
    nicheName: string,
    platforms: SocialPlatform[]
  ): Promise<CreatorsForNiche> {
    const prompt = generateCreatorsForNichePrompt(nicheName, platforms);
    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'profile-analysis',
      systemPrompt: SYSTEM_PROMPTS.profileAnalysis,
      maxTokens: 2048,
    });

    let jsonContent = response.content.trim();
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonContent = jsonMatch[0];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error('Failed to parse creators JSON:', jsonContent);
      throw new Error('AI returned invalid JSON for creators.');
    }

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

    return { niche: nicheName, influencers, similarCreators };
  }
}

/** Convert the influencers slice into the existing TopInfluencer shape. */
export const toTopInfluencer = (result: CreatorsForNiche): TopInfluencer => ({
  niche: result.niche,
  influencers: result.influencers,
});
