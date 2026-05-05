'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import RefreshScheduler from '@/components/scheduler/RefreshScheduler';
import PlatformLink from '@/components/platform-link/PlatformLink';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { TrendDictionaryService, RegenerateResult } from '@/lib/services/trend-cache-service';
import { IdeaService, IdeaResult } from '@/lib/services/idea-service';
import { TrendItem, ContentIdea } from '@/types/trends';
import { SocialPlatform } from '@/types/platforms';
import { getNicheByName } from '@/lib/data/niche-categories';
import {
  getPlatformUrl,
  hashtagUrl,
  searchUrl,
  platformLabel as platformLabelOf,
} from '@/lib/data/platforms';
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  Hash,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

const formatDuration = (ms: number): string => {
  if (ms <= 0) return 'now';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
};

export default function TrendsPage() {
  const { profile, loadProfile } = useProfileStore();
  const { config } = useConfigStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [ideasMeta, setIdeasMeta] = useState<{ fromCache: boolean; stale: boolean }>({
    fromCache: false,
    stale: false,
  });
  const [regenMeta, setRegenMeta] = useState<RegenerateResult | null>(null);
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isWarming, setIsWarming] = useState(false);

  const niches = useMemo(() => profile?.topNiches.map((n) => n.name) ?? [], [profile]);
  const platforms: SocialPlatform[] = useMemo(
    () => profile?.platforms.map((p) => p.platform) ?? [],
    [profile]
  );
  const nicheIds = useMemo(
    () =>
      niches
        .map((n) => getNicheByName(n)?.id)
        .filter((x): x is number => typeof x === 'number'),
    [niches]
  );

  // Phase 1 — fast first paint from local cache + Supabase (per-niche).
  // Phase 2 — background warm via the services' own 24h/3h gates: never-
  // fetched niches get an initial pull; ideas regenerate when their cache
  // row is missing or > 3h old. The gates make the warm a no-op when not
  // needed, so this is safe to run on every mount.
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const aiService = new AIService(config);
      const trendsService = new TrendDictionaryService(aiService);
      const ideaService = new IdeaService(aiService);

      // ── Phase 1 ─────────────────────────────────────────────────────────
      setIsLoading(true);
      let phase1Trends: TrendItem[] = [];
      try {
        phase1Trends = await trendsService.getView(nicheIds);
        if (cancelled) return;
        setTrends(phase1Trends);

        const trendTitles = phase1Trends.slice(0, 5).map((t) => t.title);
        const ideaResult: IdeaResult = await ideaService.getIdeas(
          niches,
          platforms,
          trendTitles,
          'view'
        );
        if (cancelled) return;
        setIdeas(ideaResult.ideas);
        setIdeasMeta({
          fromCache: ideaResult.fromCache,
          stale: ideaResult.staleVsCurrentTrends,
        });
      } catch (err) {
        console.error('Failed to load cached trends/ideas:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      // ── Phase 2 ─────────────────────────────────────────────────────────
      if (cancelled || nicheIds.length === 0) return;
      setIsWarming(true);
      try {
        // Trends: 24h gate per niche (never-fetched niches have lastFetchedAt=0
        // and trigger an initial pull).
        await trendsService.refreshIfStale(niches, platforms);
        if (cancelled) return;
        const refreshedTrends = await trendsService.getView(nicheIds);
        if (cancelled) return;
        if (refreshedTrends.length > 0) setTrends(refreshedTrends);

        // Ideas: 3h gate inside getIdeas('regenerate') skips the API call
        // when a row exists and is < 3h old. New niche set ⇒ no row ⇒ generate.
        const titles = (refreshedTrends.length > 0 ? refreshedTrends : phase1Trends)
          .slice(0, 5)
          .map((t) => t.title);
        const warmedIdeas = await ideaService.getIdeas(
          niches,
          platforms,
          titles,
          'regenerate'
        );
        if (cancelled) return;
        if (warmedIdeas.ideas.length > 0) {
          setIdeas(warmedIdeas.ideas);
          setIdeasMeta({
            fromCache: warmedIdeas.fromCache,
            stale: warmedIdeas.staleVsCurrentTrends,
          });
        }
      } catch (err) {
        console.warn('[trends] background warm failed:', err);
      } finally {
        if (!cancelled) setIsWarming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const handleRegenerate = async () => {
    if (!profile) return;
    setIsRegenerating(true);
    try {
      const aiService = new AIService(config);
      const trendsService = new TrendDictionaryService(aiService);
      const ideaService = new IdeaService(aiService);

      const result = await trendsService.regenerate(niches, platforms);
      setTrends(result.trends);
      setRegenMeta(result);

      const trendTitles = result.trends.slice(0, 5).map((t) => t.title);
      // Only force AI for ideas if we got fresh trends; otherwise serve cached.
      const intent = result.source === 'fresh' ? 'regenerate' : 'view';
      const ideaResult = await ideaService.getIdeas(niches, platforms, trendTitles, intent);
      setIdeas(ideaResult.ideas);
      setIdeasMeta({
        fromCache: ideaResult.fromCache,
        stale: ideaResult.staleVsCurrentTrends,
      });
    } catch (err) {
      console.error('Regenerate failed:', err);
      alert(`Regenerate failed: ${(err as Error).message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRefreshIdeas = async () => {
    if (!profile) return;
    setIsRegenerating(true);
    try {
      const aiService = new AIService(config);
      const ideaService = new IdeaService(aiService);
      const trendTitles = trends.slice(0, 5).map((t) => t.title);
      const ideaResult = await ideaService.getIdeas(
        niches,
        platforms,
        trendTitles,
        'regenerate'
      );
      setIdeas(ideaResult.ideas);
      setIdeasMeta({
        fromCache: ideaResult.fromCache,
        stale: ideaResult.staleVsCurrentTrends,
      });
    } catch (err) {
      console.error('Refresh ideas failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleSteps = (id: string) =>
    setExpandedIdeas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cycledMessage = regenMeta && regenMeta.source === 'cycled'
    ? regenMeta.cycledAroundCompleteSet
      ? `You've seen everything we have for now. Next fresh fetch in ${formatDuration(regenMeta.nextFreshAt.getTime() - Date.now())}.`
      : `Showing more cached trends. Next fresh fetch in ${formatDuration(regenMeta.nextFreshAt.getTime() - Date.now())}.`
    : null;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <RefreshScheduler />

      <main className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 animate-fade-up">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-3 tracking-tight">
              Trending <span className="gradient-text">Content</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Latest trends and ideas for your niches
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating || isLoading || isWarming}
              size="lg"
              className="shadow-colored-lg whitespace-nowrap"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Regenerate
                </>
              )}
            </Button>
            {isWarming && !isRegenerating && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Refreshing in background
              </Badge>
            )}
            {!isWarming && ideasMeta.fromCache && !isLoading && !isRegenerating && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Loaded from cache
              </Badge>
            )}
          </div>
        </div>

        {cycledMessage && (
          <Card variant="glass" className="mb-6 border-l-4 border-l-contentual-pink animate-fade-up">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-contentual-pink flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{cycledMessage}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="trends" className="space-y-6 animate-fade-up animation-delay-200">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="trends">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending Now
            </TabsTrigger>
            <TabsTrigger value="ideas">
              <Zap className="w-4 h-4 mr-2" />
              Content Ideas
            </TabsTrigger>
          </TabsList>

          {/* ── Trends ── */}
          <TabsContent value="trends" className="space-y-4">
            {isLoading ? (
              <p className="text-center text-gray-500 py-12">Loading…</p>
            ) : trends.length === 0 ? (
              <Card variant="glass" className="border-2 border-dashed border-gray-300">
                <CardContent className="py-16 text-center">
                  {isWarming ? (
                    <>
                      <Loader2 className="w-12 h-12 text-contentual-pink mx-auto mb-4 animate-spin" />
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        Generating trends for your niches…
                      </h3>
                      <p className="text-gray-500">This usually takes 10-20 seconds.</p>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-1">No Trends Yet</h3>
                      <p className="text-gray-500 mb-6">
                        Click Regenerate to fetch trending content for your niches.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              trends.map((trend, idx) => (
                <TrendCard key={trend.id} trend={trend} idx={idx} />
              ))
            )}
          </TabsContent>

          {/* ── Content Ideas ── */}
          <TabsContent value="ideas" className="space-y-4">
            {ideasMeta.stale && ideas.length > 0 && (
              <Card variant="glass" className="border-l-4 border-l-amber-400">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Trends have shifted since these ideas were generated. Refresh for fresh ideas.
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleRefreshIdeas} disabled={isRegenerating}>
                    Refresh ideas
                  </Button>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <p className="text-center text-gray-500 py-12">Loading…</p>
            ) : ideas.length === 0 ? (
              <Card variant="glass" className="border-2 border-dashed border-gray-300">
                <CardContent className="py-16 text-center">
                  {isWarming ? (
                    <>
                      <Loader2 className="w-12 h-12 text-contentual-pink mx-auto mb-4 animate-spin" />
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        Generating ideas for your niches…
                      </h3>
                      <p className="text-gray-500">This usually takes 10-20 seconds.</p>
                    </>
                  ) : (
                    <>
                      <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-1">No Content Ideas Yet</h3>
                      <p className="text-gray-500">
                        Click Regenerate above to produce ideas based on your top trends.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {ideas.map((idea, idx) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    idx={idx}
                    expanded={expandedIdeas.has(idea.id)}
                    onToggle={() => toggleSteps(idea.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── trend card ──────────────────────────────────────────────────────────────

function TrendCard({ trend, idx }: { trend: TrendItem; idx: number }) {
  return (
    <Card
      variant="elevated"
      className="group hover:-translate-y-0.5 transition-transform duration-200 animate-fade-up"
      style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white shadow-colored">
              <div className="text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-0.5" />
                <div className="text-xs font-bold">{trend.trendingScore}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-contentual-pink transition-colors">
                {trend.title}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge size="sm" variant="gradient">
                  {trend.niche.name}
                </Badge>
                {trend.platforms.map((p) => (
                  <Badge key={p} variant="secondary" size="sm">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">{trend.description}</p>

            {trend.audioTrack && (
              <p className="text-sm text-gray-500 mb-3">
                🎵 <span className="font-medium">{trend.audioTrack}</span>
              </p>
            )}

            {trend.hashtags.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap mb-3">
                <Hash className="w-4 h-4 text-contentual-pink mt-1 flex-shrink-0" />
                {trend.hashtags.flatMap((ref) => {
                  const display = ref.tag.startsWith('#') ? ref.tag : `#${ref.tag}`;
                  const tagPlatforms =
                    ref.platforms.length > 0 ? ref.platforms : trend.platforms;
                  return tagPlatforms.map((platform) => (
                    <PlatformLink
                      key={`${ref.tag}-${platform}`}
                      platform={platform}
                      href={hashtagUrl(platform, ref.tag)}
                      variant="compact"
                    >
                      {display}
                    </PlatformLink>
                  ));
                })}
              </div>
            )}

            {trend.exampleLinks.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Examples
                </p>
                <div className="flex flex-wrap gap-2">
                  {trend.exampleLinks.flatMap((ref) => {
                    const handle = ref.handle.replace(/^@/, '').trim();
                    if (!handle) return [];
                    const creatorPlatforms =
                      ref.platforms.length > 0 ? ref.platforms : trend.platforms;
                    return creatorPlatforms.map((platform) => (
                      <PlatformLink
                        key={`${ref.handle}-${platform}`}
                        platform={platform}
                        href={getPlatformUrl(platform, handle)}
                        variant="chip"
                      >
                        @{handle}
                      </PlatformLink>
                    ));
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── idea card ───────────────────────────────────────────────────────────────

function IdeaCard({
  idea,
  idx,
  expanded,
  onToggle,
}: {
  idea: ContentIdea;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const visibleSteps = expanded ? idea.steps : idea.steps.slice(0, 3);
  const hasMore = idea.steps.length > 3;

  return (
    <Card
      variant="elevated"
      className="group hover:-translate-y-0.5 transition-transform duration-200 animate-fade-up"
      style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-contentual-pink transition-colors">
            {idea.title}
          </h3>
          <Badge
            size="sm"
            className={`capitalize whitespace-nowrap ${
              idea.difficulty === 'beginner'
                ? 'bg-green-100 text-green-700 border-green-200'
                : idea.difficulty === 'intermediate'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
          >
            {idea.difficulty}
          </Badge>
        </div>

        <p className="text-gray-700 leading-relaxed">{idea.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-blue-700">
            <Clock className="w-4 h-4" />
            {idea.timeEstimate} min
          </span>
          <span className="inline-flex items-center gap-1.5 text-contentual-coral">
            <Zap className="w-4 h-4" />
            {idea.niche.name}
          </span>
        </div>

        {/* Platform pills — brand-colored so destination is obvious */}
        {idea.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              See examples on
            </span>
            {idea.platforms.map((p) => (
              <PlatformLink
                key={p}
                platform={p}
                href={searchUrl(p, idea.title)}
                variant="compact"
                title={`Search "${idea.title}" on ${platformLabelOf(p)}`}
                className="capitalize"
              >
                {p}
              </PlatformLink>
            ))}
          </div>
        )}

        {idea.steps.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Steps to Create
            </p>
            <ol className="space-y-2">
              {visibleSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-800 leading-snug">
                  <span className="w-5 h-5 bg-contentual-pink/10 text-contentual-pink rounded flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {hasMore && (
              <button
                onClick={onToggle}
                className="mt-3 inline-flex items-center gap-1 text-sm text-contentual-pink font-semibold hover:underline underline-offset-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show all {idea.steps.length} steps
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {idea.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.equipment.map((eq) => (
              <Badge key={eq} variant="secondary" size="sm">
                {eq}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
