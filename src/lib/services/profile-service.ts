import { AIService } from '../ai/ai-service';
import { CreatorProfile, CreatorSurvey } from '@/types/profile';
import { PlatformConnection } from '@/types/platforms';
import { generateProfilePrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import { getNicheById } from '../data/niche-categories';
import { saveProfile } from '../storage/db';

export class ProfileService {
  constructor(private aiService: AIService) {}

  async generateProfile(
    platforms: PlatformConnection[],
    survey: CreatorSurvey
  ): Promise<CreatorProfile> {
    const prompt = generateProfilePrompt(platforms, survey);

    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'profile-analysis',
      systemPrompt: SYSTEM_PROMPTS.profileAnalysis,
      maxTokens: 8192,
    });

    // Extract JSON from response (handle cases where AI adds extra text)
    let jsonContent = response.content.trim();

    // Try to find JSON in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (error) {
      console.error('Failed to parse JSON response:', jsonContent);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const topNiches = parsed.topNiches.map((niche: any) => {
      const fullNiche = getNicheById(niche.nicheId);
      return fullNiche || { id: niche.nicheId, name: niche.nicheName };
    }).slice(0, 3);

    const profile: CreatorProfile = {
      id: crypto.randomUUID(),
      platforms,
      survey,
      topNiches,
      similarCreators: parsed.similarCreators || [],
      engagementStrategies: parsed.engagementStrategies || [],
      topInfluencers: parsed.topInfluencers || [],
      baselineProfile: parsed.baselineProfile,
      generatedAt: new Date(),
      lastUpdated: new Date(),
    };

    await saveProfile(profile);
    return profile;
  }
}
