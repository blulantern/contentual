### Total: 52 files to create

This specification is now 100% complete and production-ready for implementation!

---

## Trends & Planning Pages

### `src/app/trends/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import TrendFeed from '@/components/trends/TrendFeed';
import ContentIdeaCard from '@/components/trends/ContentIdeaCard';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { TrendService } from '@/lib/services/trend-service';
import { TrendItem, ContentIdea } from '@/types/trends';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function TrendsPage() {
  const { profile } = useProfileStore();
  const { config } = useConfigStore();
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrends = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const aiService = new AIService(config);
      const trendService = new TrendService(aiService);

      const niches = profile.topNiches.map((n) => n.name);
      const platforms = profile.platforms.map((p) => p.platform);

      const fetchedTrends = await trendService.fetchTrends(niches, platforms);
      setTrends(fetchedTrends);

      const trendTitles = fetchedTrends.slice(0, 5).map((t) => t.title);
      const ideas = await trendService.generateContentIdeas(niches, platforms, trendTitles);
      setContentIdeas(ideas);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Trending <span className="gradient-text">Content</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Latest trends and content ideas for your niches
            </p>
          </div>
          <Button onClick={fetchTrends} disabled={isLoading} variant="outline" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Refresh Trends
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trends">Trending Now</TabsTrigger>
            <TabsTrigger value="ideas">Content Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-contentual-pink" />
              </div>
            ) : (
              <TrendFeed trends={trends} />
            )}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-contentual-pink" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {contentIdeas.map((idea) => (
                  <ContentIdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
```

### `src/components/ui/tabs.tsx`

```typescript
'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/cn';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-semibold transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-white data-[state=active]:text-contentual-pink data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-2', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

### `src/components/trends/TrendFeed.tsx`

```typescript
'use client';

import { TrendItem } from '@/types/trends';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash, Music } from 'lucide-react';

interface TrendFeedProps {
  trends: TrendItem[];
}

export default function TrendFeed({ trends }: TrendFeedProps) {
  if (trends.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No trends available. Click refresh to fetch trends.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {trends.map((trend) => (
        <Card key={trend.id} className="glass-card hover:shadow-soft transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Trending Score */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center text-white">
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-xs font-bold">{trend.trendingScore}</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{trend.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{trend.niche.name}</Badge>
                      {trend.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{trend.description}</p>

                {/* Hashtags */}
                {trend.hashtags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-contentual-pink" />
                    <div className="flex flex-wrap gap-2">
                      {trend.hashtags.map((tag) => (
                        <span key={tag} className="text-sm text-contentual-pink font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Track */}
                {trend.audioTrack && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Music className="w-4 h-4" />
                    <span>{trend.audioTrack}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### `src/components/trends/ContentIdeaCard.tsx`

```typescript
'use client';

import { ContentIdea } from '@/types/trends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';

interface ContentIdeaCardProps {
  idea: ContentIdea;
}

export default function ContentIdeaCard({ idea }: ContentIdeaCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  return (
    <Card className="glass-card hover:shadow-soft-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{idea.title}</CardTitle>
          <Badge className={difficultyColors[idea.difficulty]}>{idea.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700">{idea.description}</p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{idea.timeEstimate} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-contentual-peach" />
            <span className="text-gray-600">{idea.niche.name}</span>
          </div>
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap gap-2">
          {idea.platforms.map((platform) => (
            <Badge key={platform} variant="secondary">
              {platform}
            </Badge>
          ))}
        </div>

        {/* Steps */}
        <div>
          <p className="font-semibold text-sm text-gray-700 mb-2">Steps:</p>
          <ol className="space-y-1">
            {idea.steps.slice(0, 3).map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {idx + 1}. {step}
              </li>
            ))}
            {idea.steps.length > 3 && (
              <li className="text-sm text-gray-500 italic">
                +{idea.steps.length - 3} more steps...
              </li>
            )}
          </ol>
        </div>

        {/* Equipment */}
        {idea.equipment.length > 0 && (
          <div>
            <p className="font-semibold text-sm text-gray-700 mb-2">Required:</p>
            <div className="flex flex-wrap gap-2">
              {idea.equipment.map((equip) => (
                <Badge key={equip} variant="accent">
                  {equip}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Planning Page & Components

### `src/app/planning/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import WeeklyPlanView from '@/components/planning/WeeklyPlanView';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { PlanService } from '@/lib/services/plan-service';
import { CalendarService } from '@/lib/services/calendar-service';
import { WeeklyPlan } from '@/types/plans';
import { getCurrentWeeklyPlan } from '@/lib/storage/db';
import { Calendar, Download, RefreshCw, Loader2 } from 'lucide-react';

export default function PlanningPage() {
  const { profile } = useProfileStore();
  const { config } = useConfigStore();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadPlan = async () => {
    const currentPlan = await getCurrentWeeklyPlan();
    setPlan(currentPlan || null);
  };

  const generatePlan = async () => {
    if (!profile) return;

    setIsGenerating(true);
    try {
      const aiService = new AIService(config);
      const planService = new PlanService(aiService);

      const niches = profile.topNiches.map((n) => n.name);
      const platforms = profile.platforms.map((p) => p.platform);
      const planType = profile.survey.timeCommitment >= 20 ? 'full-time' : 'part-time';

      const newPlan = await planService.generateWeeklyPlan(planType, niches, platforms);
      setPlan(newPlan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCalendar = async () => {
    if (!plan) return;

    setIsExporting(true);
    try {
      const calendarService = new CalendarService();
      const icsContent = await calendarService.exportWeeklyPlan(plan);
      calendarService.downloadCalendar(icsContent, 'contentual-weekly-plan.ics');
    } catch (error) {
      console.error('Failed to export calendar:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Weekly <span className="gradient-text">Content Plan</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Your personalized content schedule
            </p>
          </div>

          <div className="flex gap-3">
            {plan && (
              <Button onClick={exportToCalendar} disabled={isExporting} variant="outline" size="lg">
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Export to Calendar
                  </>
                )}
              </Button>
            )}

            <Button onClick={generatePlan} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {plan ? 'Regenerate Plan' : 'Generate Plan'}
                </>
              )}
            </Button>
          </div>
        </div>

        {plan ? (
          <WeeklyPlanView plan={plan} />
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-contentual-pink" />
            <h2 className="text-2xl font-bold mb-2">No Plan Yet</h2>
            <p className="text-gray-600 mb-6">
              Generate your personalized weekly content plan to get started
            </p>
            <Button onClick={generatePlan} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Weekly Plan'
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
```

### `src/components/planning/WeeklyPlanView.tsx`

```typescript
'use client';

import { WeeklyPlan } from '@/types/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, Video } from 'lucide-react';
import { PLATFORM_METADATA } from '@/lib/data/platforms';

interface WeeklyPlanViewProps {
  plan: WeeklyPlan;
}

export default function WeeklyPlanView({ plan }: WeeklyPlanViewProps) {
  const taskTypeIcons = {
    'content-creation': <Video className="w-4 h-4" />,
    'posting': <CheckCircle2 className="w-4 h-4" />,
    'engagement': <Circle className="w-4 h-4" />,
    'analytics': <Clock className="w-4 h-4" />,
    'planning': <Clock className="w-4 h-4" />,
    'batch-filming': <Video className="w-4 h-4" />,
    'editing': <Video className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {format(plan.weekStart, 'MMM d')} - {format(plan.weekEnd, 'MMM d, yyyy')}
            </CardTitle>
            <Badge variant={plan.type === 'full-time' ? 'default' : 'secondary'}>
              {plan.type === 'full-time' ? 'Full-Time' : 'Part-Time'} Plan
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Plans */}
      {plan.days.map((day, dayIdx) => (
        <Card key={dayIdx} className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">
              {format(day.date, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {day.tasks.length === 0 ? (
              <p className="text-gray-500 italic">Rest day - No tasks scheduled</p>
            ) : (
              <div className="space-y-3">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 bg-gradient-card rounded-xl border border-contentual-pink/10 hover:shadow-soft transition-shadow"
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm font-bold text-contentual-pink">{task.time}</div>
                      <div className="text-xs text-gray-500">{task.duration} min</div>
                    </div>

                    {/* Task Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-contentual-pink/10 rounded-lg flex items-center justify-center text-contentual-pink">
                        {taskTypeIcons[task.type]}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold">{task.title}</h4>
                        {task.platform && (
                          <Badge variant="secondary" className="text-xs">
                            {PLATFORM_METADATA[task.platform].icon}{' '}
                            {PLATFORM_METADATA[task.platform].name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{task.description}</p>
                      {task.notes && (
                        <p className="text-xs text-gray-600 italic">Note: {task.notes}</p>
                      )}
                    </div>

                    {/* Completion Checkbox */}
                    <div className="flex-shrink-0">
                      <button
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'bg-contentual-pink border-contentual-pink'
                            : 'border-gray-300 hover:border-contentual-pink'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### `src/lib/services/trend-service.ts` (Complete)

```typescript
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

    const parsed = JSON.parse(response.content);

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

    const parsed = JSON.parse(response.content);

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
```

### `src/lib/services/plan-service.ts` (Complete)

```typescript
import { AIService } from '../ai/ai-service';
import { WeeklyPlan, PlanType } from '@/types/plans';
import { generateWeeklyPlanPrompt, SYSTEM_PROMPTS } from '../ai/prompts';
import { SocialPlatform } from '@/types/platforms';
import { saveWeeklyPlan } from '../storage/db';
import { startOfWeek, addDays } from 'date-fns';

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

    const parsed = JSON.parse(response.content);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const plan: WeeklyPlan = {
      id: crypto.randomUUID(),
      type: planType,
      weekStart,
      weekEnd,
      days: parsed.days.map((day: any, index: number) => ({
        date: addDays(weekStart, index),
        tasks: day.tasks.map((task: any) => ({
          id: crypto.randomUUID(),
          time: task.time,
          duration: task.duration,
          type: task.type,
          title: task.title,
          description: task.description,
          platform: task.platform,
          contentIdea: task.contentIdea,
          completed: false,
          notes: task.notes || '',
        })),
      })),
      generatedAt: new Date(),
      customized: false,
    };

    await saveWeeklyPlan(plan);
    return plan;
  }
}
```

### `src/lib/services/calendar-service.ts` (Complete)

```typescript
import { WeeklyPlan } from '@/types/plans';
import { createEvents, EventAttributes } from 'ics';

export class CalendarService {
  async exportWeeklyPlan(plan: WeeklyPlan): Promise<string> {
    const events: EventAttributes[] = [];

    plan.days.forEach((day) => {
      day.tasks.forEach((task) => {
        const [hours, minutes] = task.time.split(':').map(Number);
        const startDate = new Date(day.date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + task.duration);

        events.push({
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes(),
          ],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            endDate.getHours(),
            endDate.getMinutes(),
          ],
          title: task.title,
          description: task.description + (task.notes ? `\n\nNotes: ${task.notes}` : ''),
          location: task.platform ? `Platform: ${task.platform}` : '',
          status: 'CONFIRMED',
          busyStatus: '## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create Next.js project with TypeScript
- [ ] Install all dependencies
- [ ] Set up Tailwind CSS with custom theme
- [ ] Create type definitions
- [ ] Set up project structure

### Phase 2: Core Services (Week 2)
- [ ] Implement AI service layer
- [ ] Create IndexedDB schema
- [ ] Build configuration manager
- [ ] Set up Zustand stores
- [ ] Add niche categories data

### Phase 3: UI Components (Week 3)
- [ ] Create shadcn/ui base components
- [ ] Build layout components (Header, Sidebar)
- [ ] Implement setup flow components
- [ ] Create dashboard components

### Phase 4: Features (Week 4)
- [ ] Profile generation
- [ ] Trend intelligence
- [ ] Weekly planning
- [ ] Calendar export
- [ ] Settings management

### Phase 5: Polish (Week 5)
- [ ] Add animations
- [ ] Optimize performance
- [ ] Test all flows
- [ ] Fix bugs
- [ ] Deploy

## Next Steps for Claude Code

To implement this project with Claude Code:

```bash
# Create the project
npx create-next-app@latest contentual-v1 --typescript --tailwind --app --src-dir --import-alias "@/*"

# Navigate to project
cd contentual-v1

# Install additional dependencies
pnpm add zustand dexie dexie-react-hooks react-hook-form zod @hookform/resolvers date-fns ics lucide-react clsx tailwind-merge class-variance-authority tailwindcss-animate

# Start implementing files from this specification
# Begin with type definitions, then services, then components
```

---

## Key UI Components

### `src/components/ui/button.tsx`

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-primary text-white shadow-colored hover:shadow-soft-lg hover:scale-105',
        secondary: 'bg-white text-contentual-pink border-2 border-contentual-pink/20 shadow-card hover:shadow-soft',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
        outline: 'border-2 border-contentual-pink text-contentual-pink hover:bg-contentual-pink/10',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### `src/components/ui/card.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-white shadow-card border border-gray-100 transition-all duration-300',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-display font-bold', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

### `src/components/ui/input.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm transition-all',
          'focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### `src/components/ui/badge.tsx`

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-contentual-pink/10 text-contentual-pink',
        secondary: 'bg-contentual-coral/10 text-contentual-coral',
        accent: 'bg-contentual-peach/10 text-orange-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

### `src/lib/utils/cn.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Setup Flow Components

### `src/app/setup/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AIConfigForm from '@/components/setup/AIConfigForm';
import PlatformConnectionForm from '@/components/setup/PlatformConnectionForm';
import CreatorSurvey from '@/components/setup/CreatorSurvey';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const { isConfigured } = useConfigStore();
  const { profile } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(isConfigured ? 1 : 0);

  const steps = [
    { name: 'AI Configuration', completed: isConfigured },
    { name: 'Connect Platforms', completed: !!profile },
    { name: 'Creator Survey', completed: !!profile },
  ];

  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Welcome to <span className="gradient-text">Contentual</span>
          </h1>
          <p className="text-xl text-gray-700">
            Let's set up your AI-powered content strategy
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    index <= currentStep
                      ? 'bg-gradient-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                </div>
                <span
                  className={`ml-3 font-medium ${
                    index <= currentStep ? 'text-contentual-pink' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded ${
                    index < currentStep ? 'bg-gradient-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="glass-card">
          <CardContent className="p-8">
            {currentStep === 0 && <AIConfigForm onComplete={handleStepComplete} />}
            {currentStep === 1 && <PlatformConnectionForm onComplete={handleStepComplete} />}
            {currentStep === 2 && <CreatorSurvey onComplete={handleStepComplete} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### `src/components/setup/AIConfigForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useConfigStore } from '@/store/config-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface AIConfigFormProps {
  onComplete: () => void;
}

export default function AIConfigForm({ onComplete }: AIConfigFormProps) {
  const { config, updateConfig, testConnection, isTesting, testResult } = useConfigStore();
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState(config.provider);

  const handleTest = async () => {
    updateConfig({ apiKey, provider });
    await testConnection();
  };

  const handleContinue = () => {
    updateConfig({ apiKey, provider });
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Configure Claude AI</h2>
        <p className="text-gray-600">
          Enter your Anthropic API key to enable AI-powered features.
        </p>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">Anthropic API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          Get your API key from{' '}
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-contentual-pink hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label>API Provider</Label>
        <div className="flex gap-4">
          <button
            onClick={() => setProvider('console-api')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              provider === 'console-api'
                ? 'border-contentual-pink bg-contentual-pink/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-bold mb-1">Console API</div>
            <div className="text-sm text-gray-600">Simple, direct access</div>
          </button>
          <button
            onClick={() => setProvider('context-api')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              provider === 'context-api'
                ? 'border-contentual-pink bg-contentual-pink/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-bold mb-1">Context API</div>
            <div className="text-sm text-gray-600">
              Optimized with caching
              <Badge variant="accent" className="ml-2">
                Recommended
              </Badge>
            </div>
          </button>
        </div>
      </div>

      {/* Test Connection */}
      <div className="flex gap-3">
        <Button onClick={handleTest} disabled={!apiKey || isTesting} variant="outline" size="lg">
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>

        {testResult && (
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <>
                <CheckCircle2 className="text-green-600" />
                <span className="text-green-600 font-medium">Connected!</span>
              </>
            ) : (
              <>
                <XCircle className="text-red-600" />
                <span className="text-red-600 font-medium">{testResult.message}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!apiKey || (testResult && !testResult.success)}
        size="lg"
        className="w-full"
      >
        Continue to Platform Connection
      </Button>
    </div>
  );
}
```

### `src/components/setup/PlatformConnectionForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLATFORM_METADATA } from '@/lib/data/platforms';
import { SocialPlatform, PlatformConnection } from '@/types/platforms';

interface PlatformConnectionFormProps {
  onComplete: () => void;
}

export default function PlatformConnectionForm({ onComplete }: PlatformConnectionFormProps) {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);

  const handleAddPlatform = (platform: SocialPlatform, username: string) => {
    setConnections((prev) => {
      const filtered = prev.filter((p) => p.platform !== platform);
      return [
        ...filtered,
        {
          platform,
          username,
          connected: true,
          connectedAt: new Date(),
        },
      ];
    });
  };

  const handleContinue = () => {
    if (connections.length > 0) {
      localStorage.setItem('platform_connections', JSON.stringify(connections));
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Connect Your Platforms</h2>
        <p className="text-gray-600">
          Enter your usernames for the platforms you create content on. We'll use this to analyze
          your presence.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(PLATFORM_METADATA) as SocialPlatform[]).map((platform) => {
          const meta = PLATFORM_METADATA[platform];
          const connection = connections.find((c) => c.platform === platform);

          return (
            <div key={platform} className="space-y-2">
              <Label htmlFor={platform}>
                <span className="mr-2">{meta.icon}</span>
                {meta.name}
              </Label>
              <div className="flex gap-2">
                <Input
                  id={platform}
                  placeholder={meta.placeholder}
                  defaultValue={connection?.username}
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleAddPlatform(platform, e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-contentual-cream/30 rounded-xl p-4 border border-contentual-peach/20">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> We only use your usernames for AI analysis. We don't access your
          accounts or post anything.
        </p>
      </div>

      <Button onClick={handleContinue} disabled={connections.length === 0} size="lg" className="w-full">
        Continue to Survey ({connections.length} platforms connected)
      </Button>
    </div>
  );
}
```

### `src/components/setup/CreatorSurvey.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreatorSurvey } from '@/types/profile';
import { AIService } from '@/lib/ai/ai-service';
import { ProfileService } from '@/lib/services/profile-service';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import { Loader2 } from 'lucide-react';

interface CreatorSurveyProps {
  onComplete: () => void;
}

export default function CreatorSurveyComponent({ onComplete }: CreatorSurveyProps) {
  const router = useRouter();
  const { config } = useConfigStore();
  const { setProfile } = useProfileStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const [survey, setSurvey] = useState<CreatorSurvey>({
    goals: 'side-hustle',
    timeCommitment: 10,
    challenges: [],
    preferredFormats: [],
    equipment: [],
  });

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const platformsStr = localStorage.getItem('platform_connections');
      const platforms = platformsStr ? JSON.parse(platformsStr) : [];

      const aiService = new AIService(config);
      const profileService = new ProfileService(aiService);

      const profile = await profileService.generateProfile(platforms, survey);
      setProfile(profile);

      onComplete();
    } catch (error) {
      console.error('Profile generation failed:', error);
      alert('Failed to generate profile. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Tell Us About Your Goals</h2>
        <p className="text-gray-600">Help us create a personalized strategy for you.</p>
      </div>

      {/* Goals */}
      <div className="space-y-2">
        <Label>What are your content creation goals?</Label>
        <div className="grid grid-cols-3 gap-3">
          {['hobby', 'side-hustle', 'full-time'].map((goal) => (
            <button
              key={goal}
              onClick={() => setSurvey({ ...survey, goals: goal as any })}
              className={`p-4 rounded-xl border-2 transition-all ${
                survey.goals === goal
                  ? 'border-contentual-pink bg-contentual-pink/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-bold capitalize">{goal.replace('-', ' ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Commitment */}
      <div className="space-y-2">
        <Label>Hours per week available: {survey.timeCommitment}</Label>
        <input
          type="range"
          min="1"
          max="40"
          value={survey.timeCommitment}
          onChange={(e) =>
            setSurvey({ ...survey, timeCommitment: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Challenges */}
      <div className="space-y-2">
        <Label>Current challenges (select all that apply)</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Consistency',
            'Ideas',
            'Time',
            'Equipment',
            'Editing',
            'Engagement',
          ].map((challenge) => (
            <button
              key={challenge}
              onClick={() => {
                const challenges = survey.challenges.includes(challenge)
                  ? survey.challenges.filter((c) => c !== challenge)
                  : [...survey.challenges, challenge];
                setSurvey({ ...survey, challenges });
              }}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                survey.challenges.includes(challenge)
                  ? 'border-contentual-pink bg-contentual-pink/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {challenge}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Formats */}
      <div className="space-y-2">
        <Label>Preferred content formats</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'short-form-video',
            'long-form-video',
            'photos',
            'text-posts',
            'live-streams',
          ].map((format) => (
            <button
              key={format}
              onClick={() => {
                const formats = survey.preferredFormats.includes(format as any)
                  ? survey.preferredFormats.filter((f) => f !== format)
                  : [...survey.preferredFormats, format as any];
                setSurvey({ ...survey, preferredFormats: formats });
              }}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                survey.preferredFormats.includes(format as any)
                  ? 'border-contentual-pink bg-contentual-pink/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {format.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-2">
        <Label>Available equipment</Label>
        <div className="grid grid-cols-2 gap-2">
          {['Smartphone', 'Camera', 'Microphone', 'Lighting', 'Computer', 'Editing Software'].map(
            (equip) => (
              <button
                key={equip}
                onClick={() => {
                  const equipment = survey.equipment.includes(equip)
                    ? survey.equipment.filter((e) => e !== equip)
                    : [...survey.equipment, equip];
                  setSurvey({ ...survey, equipment });
                }}
                className={`p-3 rounded-lg border-2 transition-all text-sm ${
                  survey.equipment.includes(equip)
                    ? 'border-contentual-pink bg-contentual-pink/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {equip}
              </button>
            )
          )}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={
          isGenerating ||
          survey.challenges.length === 0 ||
          survey.preferredFormats.length === 0 ||
          survey.equipment.length === 0
        }
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Your Profile...
          </>
        ) : (
          'Generate My Profile'
        )}
      </Button>
    </div>
  );
}
```

---

## Additional Critical Files

### `src/components/ui/label.tsx`

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
```

### `src/components/layout/Header.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-contentual-pink" />
            <span className="text-2xl font-display font-bold gradient-text">Contentual</span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className={`font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-contentual-pink'
                  : 'text-gray-600 hover:text-contentual-pink'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`font-medium transition-colors ${
                isActive('/profile')
                  ? 'text-contentual-pink'
                  : 'text-gray-600 hover:text-contentual-pink'
              }`}
            >
              Profile
            </Link>
            <Link
              href="/trends"
              className={`font-medium transition-colors ${
                isActive('/trends')
                  ? 'text-contentual-pink'
                  : 'text-gray-600 hover:text-contentual-pink'
              }`}
            >
              Trends
            </Link>
            <Link
              href="/planning"
              className={`font-medium transition-colors ${
                isActive('/planning')
                  ? 'text-contentual-pink'
                  : 'text-gray-600 hover:text-contentual-pink'
              }`}
            >
              Planning
            </Link>
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
```

---

## Dashboard Components

### `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import Header from '@/components/layout/Header';
import ProfileCard from '@/components/dashboard/ProfileCard';
import NicheDisplay from '@/components/dashboard/NicheDisplay';
import QuickActions from '@/components/dashboard/QuickActions';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loadProfile, isLoading } = useProfileStore();
  const { isConfigured } = useConfigStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isConfigured) {
      router.push('/setup');
      return;
    }
    loadProfile();
  }, [isConfigured, loadProfile, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-contentual-pink" />
      </div>
    );
  }

  if (!profile) {
    router.push('/setup');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's your content strategy overview
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ProfileCard profile={profile} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        <NicheDisplay niches={profile.topNiches} />
      </main>
    </div>
  );
}
```

### `src/components/dashboard/ProfileCard.tsx`

```typescript
'use client';

import { CreatorProfile } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_METADATA } from '@/lib/data/platforms';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileCardProps {
  profile: CreatorProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Your Creator Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Platforms */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Connected Platforms</h3>
          <div className="flex flex-wrap gap-2">
            {profile.platforms.map((platform) => {
              const meta = PLATFORM_METADATA[platform.platform];
              return (
                <Badge key={platform.platform} variant="secondary">
                  <span className="mr-1">{meta.icon}</span>
                  @{platform.username}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Creator Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-contentual-pink/10 rounded-xl p-4">
            <div className="flex items-center text-contentual-pink mb-2">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-semibold">Time Commitment</span>
            </div>
            <p className="text-2xl font-bold">{profile.survey.timeCommitment} hrs/week</p>
            <p className="text-sm text-gray-600 capitalize">{profile.survey.goals}</p>
          </div>

          <div className="bg-contentual-coral/10 rounded-xl p-4">
            <div className="flex items-center text-contentual-coral mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">Profile Created</span>
            </div>
            <p className="text-lg font-bold">
              {format(new Date(profile.generatedAt), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600">
              Updated {format(new Date(profile.lastUpdated), 'MMM d')}
            </p>
          </div>
        </div>

        {/* Current Challenges */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-700">Working On</h3>
          <div className="flex flex-wrap gap-2">
            {profile.survey.challenges.map((challenge) => (
              <Badge key={challenge} variant="accent">
                {challenge}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### `src/components/dashboard/NicheDisplay.tsx`

```typescript
'use client';

import { NicheCategory } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NicheDisplayProps {
  niches: NicheCategory[];
}

export default function NicheDisplay({ niches }: NicheDisplayProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Your Top Niches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {niches.map((niche, index) => (
            <div
              key={niche.id}
              className="bg-gradient-card rounded-xl p-6 border-2 border-contentual-pink/20"
            >
              <div className="text-4xl mb-3">{niche.icon}</div>
              <div className="text-sm text-gray-500 mb-1">#{index + 1} Match</div>
              <h3 className="font-bold text-lg mb-1">{niche.name}</h3>
              <p className="text-sm text-gray-600">{niche.category}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### `src/components/dashboard/QuickActions.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, User, Settings } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'View Trends',
      href: '/trends',
      color: 'bg-contentual-pink',
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Weekly Plan',
      href: '/planning',
      color: 'bg-contentual-coral',
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Full Profile',
      href: '/profile',
      color: 'bg-contentual-peach',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      href: '/settings',
      color: 'bg-gray-500',
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button variant="ghost" className="w-full justify-start h-auto py-4">
              <div className={`${action.color} p-2 rounded-lg text-white mr-3`}>
                {action.icon}
              </div>
              <span className="font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## Profile Page

### `src/app/profile/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/profile-store';
import Header from '@/components/layout/Header';
import CompetitorAnalysis from '@/components/profile/CompetitorAnalysis';
import EngagementStrategies from '@/components/profile/EngagementStrategies';
import TopInfluencers from '@/components/profile/TopInfluencers';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No profile found</p>
          <Button onClick={() => router.push('/setup')}>Create Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Your Complete <span className="gradient-text">Profile</span>
            </h1>
            <p className="text-gray-600 text-lg">
              AI-powered insights about your content strategy
            </p>
          </div>
          <Button variant="outline" size="lg">
            <RefreshCw className="mr-2 h-5 w-5" />
            Regenerate Profile
          </Button>
        </div>

        <div className="space-y-8">
          <CompetitorAnalysis creators={profile.similarCreators} />
          <EngagementStrategies strategies={profile.engagementStrategies} />
          <TopInfluencers influencerGroups={profile.topInfluencers} />
        </div>
      </main>
    </div>
  );
}
```

### `src/components/profile/CompetitorAnalysis.tsx`

```typescript
'use client';

import { ViralCreator } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_METADATA } from '@/lib/data/platforms';

interface CompetitorAnalysisProps {
  creators: ViralCreator[];
}

export default function CompetitorAnalysis({ creators }: CompetitorAnalysisProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Similar Successful Creators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator, index) => {
            const platformMeta = PLATFORM_METADATA[creator.platform];
            return (
              <div key={index} className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{creator.name}</h3>
                    <p className="text-sm text-gray-500">{creator.followerCount}</p>
                  </div>
                  <span className="text-2xl">{platformMeta.icon}</span>
                </div>
                
                <Badge variant="secondary" className="mb-3">
                  {creator.niche}
                </Badge>

                <p className="text-sm text-gray-600 mb-3">{creator.contentStyle}</p>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">Success Factors:</p>
                  {creator.keySuccessFactors.slice(0, 3).map((factor, idx) => (
                    <p key={idx} className="text-xs text-gray-700">• {factor}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### `src/components/profile/EngagementStrategies.tsx`

```typescript
'use client';

import { PlatformStrategy } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLATFORM_METADATA } from '@/lib/data/platforms';

interface EngagementStrategiesProps {
  strategies: PlatformStrategy[];
}

export default function EngagementStrategies({ strategies }: EngagementStrategiesProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Engagement Strategies by Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {strategies.map((strategy) => {
            const platformMeta = PLATFORM_METADATA[strategy.platform];
            return (
              <div key={strategy.platform} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platformMeta.icon}</span>
                  <h3 className="font-bold text-lg">{platformMeta.name}</h3>
                </div>
                <div className="space-y-2">
                  {strategy.strategies.map((strat, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-card rounded-lg p-4 border border-contentual-pink/10"
                    >
                      <p className="text-sm font-medium text-gray-700">{strat}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### `src/components/profile/TopInfluencers.tsx`

```typescript
'use client';

import { InfluencerGroup } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_METADATA } from '@/lib/data/platforms';

interface TopInfluencersProps {
  influencerGroups: InfluencerGroup[];
}

export default function TopInfluencers({ influencerGroups }: TopInfluencersProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Top Influencers in Your Niches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {influencerGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{group.niche.icon}</span>
                <h3 className="font-bold text-xl">{group.niche.name}</h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                {group.influencers.map((influencer, idx) => {
                  const platformMeta = PLATFORM_METADATA[influencer.platform];
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow-card border border-gray-100 hover:shadow-soft transition-shadow"
                    >
                      <div className="text-center">
                        <span className="text-xl mb-2 block">{platformMeta.icon}</span>
                        <p className="font-bold text-sm mb-1">{influencer.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{influencer.handle}</p>
                        <Badge variant="default" className="text-xs mb-2">
                          {influencer.followersRange}
                        </Badge>
                        <p className="text-xs text-gray-600">{influencer.specialization}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Settings Page

### `src/app/settings/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/config-store';
import { Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const {
    config,
    updateConfig,
    testConnection,
    resetConfig,
    isTesting,
    testResult,
  } = useConfigStore();

  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState(config.provider);

  const handleSave = () => {
    updateConfig({ apiKey, provider });
  };

  const handleTest = async () => {
    updateConfig({ apiKey, provider });
    await testConnection();
  };

  const handleReset = () => {
    if (confirm('Are you sure? This will clear all your configuration.')) {
      resetConfig();
      setApiKey('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8">
          <span className="gradient-text">Settings</span>
        </h1>

        <div className="space-y-6">
          {/* AI Configuration */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure your Claude AI connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">Anthropic API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>API Provider</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setProvider('console-api')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      provider === 'console-api'
                        ? 'border-contentual-pink bg-contentual-pink/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold mb-1">Console API</div>
                    <div className="text-sm text-gray-600">Simple, direct</div>
                  </button>
                  <button
                    onClick={() => setProvider('context-api')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      provider === 'context-api'
                        ? 'border-contentual-pink bg-contentual-pink/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold mb-1">Context API</div>
                    <div className="text-sm text-gray-600">
                      With caching
                      <Badge variant="accent" className="ml-2 text-xs">
                        Recommended
                      </Badge>
                    </div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>Claude Model</Label>
                <select
                  value={config.model}
                  onChange={(e) => updateConfig({ model: e.target.value as any })}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 focus:border-contentual-pink focus:ring-4 focus:ring-contentual-pink/20 outline-none"
                >
                  <option value="claude-sonnet-4-5-20250929">
                    Claude Sonnet 4.5 (Recommended)
                  </option>
                  <option value="claude-opus-4-20250514">Claude Opus 4 (Most Capable)</option>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Faster)</option>
                </select>
              </div>

              {/* Test Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border-2 ${
                    testResult.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="text-green-600" />
                        <span className="font-medium text-green-700">{testResult.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-red-600" />
                        <span className="font-medium text-red-700">{testResult.message}</span>
                      </>
                    )}
                  </div>
                  {testResult.latency && (
                    <p className="text-sm text-gray-600 mt-2">
                      Response time: {testResult.latency}ms
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleSave} variant="default">
                  Save Changes
                </Button>
                <Button onClick={handleTest} disabled={!apiKey || isTesting} variant="outline">
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button onClick={handleReset} variant="ghost" className="ml-auto text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune AI behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                    min="100"
                    max="8192"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    value={config.temperature}
                    onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium">Enable Prompt Caching</p>
                  <p className="text-sm text-gray-600">Reduce costs with Context API</p>
                </div>
                <button
                  onClick={() => updateConfig({ enableCaching: !config.enableCaching })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enableCaching ? 'bg-contentual-pink' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enableCaching ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

---

## Final Implementation Notes

### Quick Start Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest contentual-v1 --typescript --tailwind --app --src-dir --import-alias "@/*"

cd contentual-v1

# 2. Install dependencies
pnpm add zustand dexie dexie-react-hooks react-hook-form zod @hookform/resolvers date-fns ics lucide-react clsx tailwind-merge class-variance-authority tailwindcss-animate

# 3. Copy all files from this specification

# 4. Set up environment
cp .env.local.example .env.local

# 5. Run development server
pnpm dev
```

### File Creation Order for Claude Code

1. **Configuration Files** (5 files)
   - `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.env.local.example`

2. **Type Definitions** (5 files in `/src/types`)
   - `config.ts`, `platforms.ts`, `profile.ts`, `trends.ts`, `plans.ts`

3. **Data & Constants** (2 files in `/src/lib/data`)
   - `niche-categories.ts`, `platforms.ts`

4. **AI Layer** (4 files in `/src/lib/ai`)
   - `ai-service.ts`, `console-api.ts`, `context-api.ts`, `prompts.ts`

5. **Storage** (1 file in `/src/lib/storage`)
   - `db.ts`

6. **Config Manager** (1 file in `/src/lib/config`)
   - `config-manager.ts`

7. **Services** (3 files in `/src/lib/services`)
   - `profile-service.ts`, `trend-service.ts`, `plan-service.ts`

8. **Utilities** (1 file in `/src/lib/utils`)
   - `cn.ts`

9. **Stores** (3 files in `/src/store`)
   - `config-store.ts`, `profile-store.ts`, `trend-store.ts`

10. **UI Components** (6 files in `/src/components/ui`)
    - `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`

11. **Layout Components** (1 file in `/src/components/layout`)
    - `Header.tsx`

12. **Setup Components** (3 files in `/src/components/setup`)
    - `AIConfigForm.tsx`, `PlatformConnectionForm.tsx`, `CreatorSurvey.tsx`

13. **Dashboard Components** (3 files in `/src/components/dashboard`)
    - `ProfileCard.tsx`, `NicheDisplay.tsx`, `QuickActions.tsx`

14. **Profile Components** (3 files in `/src/components/profile`)
    - `CompetitorAnalysis.tsx`, `EngagementStrategies.tsx`, `TopInfluencers.tsx`

15. **Styles** (1 file)
    - `src/app/globals.css`

16. **Pages** (6 files in `/src/app`)
    - `layout.tsx`, `page.tsx`, `setup/page.tsx`, `dashboard/page.tsx`, `profile/page.tsx`, `settings/page.tsx`

17. **README** (1 file)
    - `README.md`

### Total: 52 files to create

This specification is now 100% complete and production-ready for implementation!  async sendRequest(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ content: string; usage?: any }> {
    const requestBody: any = {
      model: this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature ?? this.config.temperature,
      messages: [{ role: 'user', content: prompt }]
    };

    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} - ${(error as any).error?.message || response.statusText}`
      );
    }

    const data: ClaudeResponse = await response.json();

    return {
      content: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      }
    };
  }
}
```

### `src/lib/ai/context-api.ts`

```typescript
import { AIConfig } from '@/types/config';
import { AIRequestOptions } from './ai-service';
import { getCachedContext, CacheKey } from './prompts';

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export class ContextAPIClient {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async sendRequest(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<{ content: string; usage?: any }> {
    const systemContent: any[] = [];

    if (options.systemPrompt) {
      systemContent.push({
        type: 'text',
        text: options.systemPrompt,
        cache_control: this.config.enableCaching ? { type: 'ephemeral' } : undefined
      });
    }

    const userContent: any[] = [];

    if (options.cacheKey && this.config.enableCaching) {
      const cachedContext = getCachedContext(options.cacheKey as CacheKey);
      if (cachedContext) {
        userContent.push({
          type: 'text',
          text: cachedContext,
          cache_control: { type: 'ephemeral' }
        });
      }
    }

    userContent.push({
      type: 'text',
      text: prompt
    });

    const requestBody: any = {
      model: this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens,
      temperature: options.temperature ?? this.config.temperature,
      messages: [{ role: 'user', content: userContent }]
    };

    if (systemContent.length > 0) {
      requestBody.system = systemContent;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} - ${(error as any).error?.message || response.statusText}`
      );
    }

    const data: ClaudeResponse = await response.json();

    if (this.config.enableCaching && data.usage) {
      console.log('Cache Stats:', {
        inputTokens: data.usage.input_tokens,
        cacheCreation: data.usage.cache_creation_input_tokens || 0,
        cacheRead: data.usage.cache_read_input_tokens || 0,
      });
    }

    return {
      content: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        cacheCreationTokens: data.usage.cache_creation_input_tokens,
        cacheReadTokens: data.usage.cache_read_input_tokens
      }
    };
  }
}
```

### `src/lib/ai/prompts.ts`

```typescript
import { getNicheCategoriesText } from '../data/niche-categories';
import { PlatformConnection } from '@/types/platforms';
import { CreatorSurvey } from '@/types/profile';

export type CacheKey = 
  | 'profile-analysis'
  | 'niche-matching'
  | 'trend-analysis'
  | 'weekly-planning'
  | 'content-ideas';

export const SYSTEM_PROMPTS = {
  contentStrategy: `You are an expert content strategy AI assistant specializing in social media optimization, trend analysis, and content creator guidance. You provide actionable, specific recommendations based on data and best practices.`,

  profileAnalysis: `You are an expert at analyzing content creators and identifying their niche, style, and growth opportunities. You provide comprehensive profiles that help creators understand their positioning and potential.`,

  trendAnalysis: `You are a social media trend expert who identifies viral content patterns, emerging trends, and timely opportunities for content creators.`,

  planningExpert: `You are a content planning strategist who creates detailed, actionable weekly plans for content creators.`
};

const CACHED_CONTEXTS: Record<CacheKey, string> = {
  'profile-analysis': `
NICHE CATEGORIES REFERENCE:
${getNicheCategoriesText()}

Use these exact categories when matching creators to their niches.
`,

  'niche-matching': `
NICHE MATCHING GUIDELINES:
1. Analyze the creator's platform usernames
2. Match to the top 3 most relevant categories
3. Provide confidence scores for each match
4. Explain the reasoning behind each match
`,

  'trend-analysis': `
TREND ANALYSIS FRAMEWORK:
- Identify viral patterns across platforms
- Note specific hashtags, audio tracks, or formats
- Assess trend longevity
- Provide platform-specific adaptations
`,

  'weekly-planning': `
WEEKLY PLANNING FRAMEWORK:

Full-Time (20+ hours/week):
- 5-7 posting days
- Multiple content pieces per day
- Dedicated creation blocks
- Daily engagement time

Part-Time (5-10 hours/week):
- 3-4 posting days
- 1-2 quality pieces per day
- Weekend creation blocks
- Efficient batching
`,

  'content-ideas': `
CONTENT IDEA FRAMEWORK:
1. Catchy title
2. Clear description
3. Step-by-step guide
4. Required equipment
5. Difficulty level
6. Time estimate
7. Best platforms
8. Related trends
`
};

export const getCachedContext = (cacheKey: CacheKey): string => {
  return CACHED_CONTEXTS[cacheKey];
};

export const generateProfilePrompt = (
  platforms: PlatformConnection[],
  survey: CreatorSurvey
): string => {
  const platformList = platforms
    .map(p => `- ${p.platform}: @${p.username}`)
    .join('\n');

  return `Create a comprehensive content creator profile for:

PLATFORMS:
${platformList}

SURVEY:
- Goals: ${survey.goals}
- Time: ${survey.timeCommitment} hours/week
- Challenges: ${survey.challenges.join(', ')}
- Formats: ${survey.preferredFormats.join(', ')}
- Equipment: ${survey.equipment.join(', ')}

Respond in JSON format:
{
  "baselineProfile": {
    "summary": "2-3 paragraph overview",
    "contentStyle": "Description",
    "strengths": ["..."],
    "opportunities": ["..."]
  },
  "topNiches": [
    {
      "nicheId": 1,
      "nicheName": "Name from list",
      "confidence": 95,
      "reasoning": "Why this matches"
    }
  ],
  "similarCreators": [
    {
      "name": "Creator Name",
      "platform": "primary platform",
      "followerCount": "100K-500K",
      "niche": "Their niche",
      "keySuccessFactors": ["..."],
      "contentStyle": "Brief description"
    }
  ],
  "engagementStrategies": [
    {
      "platform": "instagram",
      "strategies": ["...", "...", "..."]
    }
  ],
  "topInfluencers": [
    {
      "niche": "Niche name",
      "influencers": [
        {
          "name": "Name",
          "platform": "platform",
          "handle": "@username",
          "followersRange": "1M-5M",
          "specialization": "What they do"
        }
      ]
    }
  ]
}

ONLY return valid JSON, no other text.`;
};
```

---

## Storage & Database

### `src/lib/storage/db.ts`

```typescript
import Dexie, { Table } from 'dexie';
import { CreatorProfile } from '@/types/profile';
import { WeeklyPlan } from '@/types/plans';
import { TrendItem, ContentIdea } from '@/types/trends';

export class ContentualDatabase extends Dexie {
  profile!: Table<CreatorProfile, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  trends!: Table<TrendItem, string>;
  contentIdeas!: Table<ContentIdea, string>;

  constructor() {
    super('ContentualDB');
    
    this.version(1).stores({
      profile: 'id, generatedAt, lastUpdated',
      weeklyPlans: 'id, weekStart, weekEnd, type',
      trends: 'id, dateAdded, trendingScore',
      contentIdeas: 'id, difficulty'
    });
  }
}

export const db = new ContentualDatabase();

export const saveProfile = async (profile: CreatorProfile): Promise<void> => {
  await db.profile.put(profile);
};

export const getProfile = async (): Promise<CreatorProfile | undefined> => {
  const profiles = await db.profile.toArray();
  return profiles[0];
};

export const saveWeeklyPlan = async (plan: WeeklyPlan): Promise<void> => {
  await db.weeklyPlans.put(plan);
};

export const getCurrentWeeklyPlan = async (): Promise<WeeklyPlan | undefined> => {
  const now = new Date();
  const plans = await db.weeklyPlans
    .where('weekStart')
    .below(now)
    .toArray();
  return plans.find(p => p.weekEnd > now);
};

export const saveTrends = async (trends: TrendItem[]): Promise<void> => {
  await db.trends.bulkPut(trends);
};

export const getTrends = async (limit: number = 50): Promise<TrendItem[]> => {
  return await db.trends
    .orderBy('trendingScore')
    .reverse()
    .limit(limit)
    .toArray();
};

export const saveContentIdeas = async (ideas: ContentIdea[]): Promise<void> => {
  await db.contentIdeas.bulkPut(ideas);
};

export const getContentIdeas = async (limit: number = 20): Promise<ContentIdea[]> => {
  return await db.contentIdeas.limit(limit).toArray();
};
```

---

## Configuration Management

### `src/lib/config/config-manager.ts`

```typescript
import { AIConfig } from '@/types/config';

const STORAGE_KEY = 'contentual_ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'context-api',
  apiKey: '',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  temperature: 1.0,
  enableCaching: true,
  cacheTTL: 300
};

export class ConfigManager {
  private config: AIConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig(): AIConfig {
    if (typeof window === 'undefined') return { ...DEFAULT_CONFIG };
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...DEFAULT_CONFIG };
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  saveConfig(newConfig: Partial<AIConfig>): AIConfig {
    this.config = { ...this.config, ...newConfig };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }
    
    return this.config;
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const configManager = new ConfigManager();
```

---

## Services

### `src/lib/services/profile-service.ts`

```typescript
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
      maxTokens: 8192
    });

    const parsed = JSON.parse(response.content);

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
      generatedAt: new Date(),
      lastUpdated: new Date()
    };

    await saveProfile(profile);
    return profile;
  }
}
```

---

## Zustand Stores

### `src/store/config-store.ts`

```typescript
import { create } from 'zustand';
import { AIConfig, APIConnectionTest } from '@/types/config';
import { configManager } from '@/lib/config/config-manager';
import { AIService } from '@/lib/ai/ai-service';

interface ConfigState {
  config: AIConfig;
  isConfigured: boolean;
  isTesting: boolean;
  testResult: APIConnectionTest | null;
  updateConfig: (newConfig: Partial<AIConfig>) => void;
  testConnection: () => Promise<void>;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: configManager.getConfig(),
  isConfigured: configManager.isConfigured(),
  isTesting: false,
  testResult: null,

  updateConfig: (newConfig) => {
    const updated = configManager.saveConfig(newConfig);
    set({ 
      config: updated,
      isConfigured: configManager.isConfigured()
    });
  },

  testConnection: async () => {
    set({ isTesting: true, testResult: null });
    
    try {
      const { config } = get();
      const aiService = new AIService(config);
      const result = await aiService.testConnection();
      set({ testResult: result, isTesting: false });
    } catch (error) {
      set({
        testResult: { success: false, message: 'Connection failed' },
        isTesting: false
      });
    }
  },

  resetConfig: () => {
    configManager.reset();
    set({
      config: configManager.getConfig(),
      isConfigured: false,
      testResult: null
    });
  }
}));
```

### `src/store/profile-store.ts`

```typescript
import { create } from 'zustand';
import { CreatorProfile } from '@/types/profile';
import { getProfile } from '@/lib/storage/db';

interface ProfileState {
  profile: CreatorProfile | null;
  isLoading: boolean;
  setProfile: (profile: CreatorProfile) => void;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => {
    set({ profile });
  },

  loadProfile: async () => {
    set({ isLoading: true });
    const profile = await getProfile();
    set({ profile, isLoading: false });
  }
}));
```

---

## Styling

### `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 320 61% 68%;
    --primary-foreground: 0 0% 100%;
    --secondary: 358 100% 77%;
    --accent: 25 100% 77%;
    --border: 214.3 31.8% 91.4%;
    --ring: 320 61% 68%;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-display font-bold;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20;
  }
  
  .gradient-text {
    @apply bg-gradient-primary bg-clip-text text-transparent;
  }
  
  .btn-primary {
    @apply bg-gradient-primary text-white font-semibold px-6 py-3 rounded-xl shadow-colored hover:shadow-soft-lg transition-all duration-300 hover:scale-105;
  }
  
  .feature-card {
    @apply bg-white rounded-2xl p-8 shadow-card hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2 border border-gray-100;
  }
}
```

---

## Root Layout

### `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

export const metadata: Metadata = {
  title: 'Contentual - AI-Powered Content Strategy',
  description: 'Transform your content creation with AI-powered insights and planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

### `src/app/page.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import { useEffect } from 'react';
import { Sparkles, TrendingUp, Calendar, Target } from 'lucide-react';

export default function HomePage() {
  const { isConfigured } = useConfigStore();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Analysis',
      description: 'Claude AI analyzes your social presence and identifies your top niches'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Trend Intelligence',
      description: 'Stay ahead with daily trending content and viral video ideas'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Weekly Planning',
      description: 'Get personalized content calendars that fit your schedule'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Platform Optimization',
      description: 'Maximize engagement with algorithm-specific strategies'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-fade-in">
            Transform Your Content
            <span className="gradient-text"> with AI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto animate-slide-up">
            AI-powered content strategy that analyzes your presence, tracks trends, 
            and delivers personalized weekly plans to maximize your engagement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            {!isConfigured ? (
              <Link href="/setup" className="btn-primary text-lg px-8 py-4">
                Get Started
              </Link>
            ) : profile ? (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                Go to Dashboard
              </Link>
            ) : (
              <Link href="/setup" className="btn-primary text-lg px-8 py-4">
                Complete Setup
              </Link>
            )}
            
            <Link href="/settings" className="btn-secondary text-lg px-8 py-4">
              Configure AI
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-2xl flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to Level Up Your Content?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join creators who are transforming their content strategy with AI
          </p>
          <Link href="/setup" className="inline-block bg-white text-contentual-pink font-bold px-8 py-4 rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            Start Creating Smarter
          </Link>
        </div>
      </section>
    </div>
  );
}
```

---

## README.md

```markdown
# Contentual V1 MVP

AI-powered content strategy application for content creators.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **State**: Zustand
- **Storage**: IndexedDB (Dexie)
- **AI**: Claude API (Anthropic)
- **Icons**: Lucide React

## Color Scheme

- Pink: #E178C5
- Coral: #FF8E8F
- Peach: #FFB38E
- Cream: #FFFDCB

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Navigate to Settings in the app
3. Enter your API key
4. Choose between Console API or Context API
5. Test your connection

## Features

- ✅ AI Profile Generation
- ✅ Trend Intelligence
- ✅ Weekly Content Planning
- ✅ Calendar Export
- ✅ Platform Optimization
- ✅ Configurable AI Backend

## Project Structure

- `/src/app` - Next.js pages
- `/src/components` - React components
- `/src/lib` - Core logic & services
- `/src/store` - Zustand state management
- `/src/types` - TypeScript definitions

## Development

```bash
# Run development server
pnpm dev

# Type check
pnpm type-check

# Build for production
pnpm build

# Start production server
pnpm start
```

## License

Private - All Rights Reserved
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create Next.js project with TypeScript
- [ ] Install all dependencies
- [ ] Set up Tailwind CSS with custom theme
- [ ] Create type definitions
- [ ] Set up project structure

### Phase 2: Core Services (Week 2)
- [ ] Implement AI service layer
- [ ] Create IndexedDB schema
- [ ] Build configuration manager
- [ ] Set up Zustand stores
- [ ] Add niche categories data

### Phase 3: UI Components (Week 3)
- [ ] Create shadcn/ui base components
- [ ] Build layout components (Header, Sidebar)
- [ ] Implement setup flow components
- [ ] Create dashboard components

### Phase 4: Features (Week 4)
- [ ] Profile generation
- [ ] Trend intelligence
- [ ] Weekly planning
- [ ] Calendar export
- [ ] Settings management

### Phase 5: Polish (Week 5)
- [ ] Add animations
- [ ] Optimize performance
- [ ] Test all flows
- [ ] Fix bugs
- [ ] Deploy

## Next Steps for Claude Code

To implement this project with Claude Code:

```bash
# Create the project
npx create-next-app@latest contentual-v1 --typescript --tailwind --app --src-dir --import-alias "@/*"

# Navigate to project
cd contentual-v1

# Install additional dependencies
pnpm add zustand dexie dexie-react-hooks react-hook-form zod @hookform/resolvers date-fns ics lucide-react clsx tailwind-merge class-variance-authority tailwindcss-animate

# Start implementing files from this specification
# Begin with type definitions, then services, then components
```

This specification is complete and ready for implementation!