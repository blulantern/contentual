import { AIService } from '../ai/ai-service';
import { WeeklyPlan, PlanType } from '@/types/plans';
import { generateWeeklyPlanPrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import { SocialPlatform } from '@/types/platforms';
import { SUPPORTED_PLATFORMS } from '../data/platforms';
import { saveWeeklyPlan } from '../storage/db';
import { startOfWeek, addDays } from 'date-fns';

const isSupportedPlatform = (v: unknown): v is SocialPlatform =>
  typeof v === 'string' && (SUPPORTED_PLATFORMS as string[]).includes(v.toLowerCase());

const coercePlatform = (v: unknown): SocialPlatform | undefined => {
  if (typeof v !== 'string') return undefined;
  const lower = v.toLowerCase();
  return isSupportedPlatform(lower) ? (lower as SocialPlatform) : undefined;
};

export class PlanService {
  constructor(private aiService: AIService) {}

  async generateWeeklyPlan(
    planType: PlanType,
    niches: string[],
    platforms: SocialPlatform[],
    trends: string[] = []
  ): Promise<WeeklyPlan> {
    const prompt = generateWeeklyPlanPrompt(planType, niches, platforms, trends);

    const response = await this.aiService.generateCompletion(prompt, {
      cacheKey: 'weekly-planning',
      systemPrompt: SYSTEM_PROMPTS.planningExpert,
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
      console.error('Failed to parse weekly plan JSON:', jsonContent);
      throw new Error('AI returned invalid JSON format. Please try again.');
    }

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const rawDays: any[] = Array.isArray(parsed.days) ? parsed.days : [];
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = rawDays[index] ?? {};
      const rawTasks: any[] = Array.isArray(day.tasks) ? day.tasks : [];
      return {
        date: addDays(weekStart, index),
        tasks: rawTasks.map((task: any) => ({
          id: crypto.randomUUID(),
          time: task.time,
          duration: task.duration,
          type: task.type,
          title: task.title,
          description: task.description,
          platform: coercePlatform(task.platform),
          contentIdea: task.contentIdea,
          completed: false,
          notes: task.notes || '',
        })),
      };
    });

    const plan: WeeklyPlan = {
      id: crypto.randomUUID(),
      type: planType,
      weekStart,
      weekEnd,
      days,
      generatedAt: new Date(),
      customized: false,
    };

    await saveWeeklyPlan(plan);
    return plan;
  }
}
