'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { TrendService } from '@/lib/services/trend-service';
import { TrendCacheService } from '@/lib/services/trend-cache-service';
import { TrendItem, ContentIdea } from '@/types/trends';
import { RefreshCw, Loader2, TrendingUp, Hash, Clock, Zap } from 'lucide-react';

export default function TrendsPage() {
  const { profile } = useProfileStore();
  const { config } = useConfigStore();
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  const fetchTrends = async (forceRefresh: boolean = false) => {
    if (!profile) return;

    setIsLoading(true);
    setUsingCache(false);
    try {
      const aiService = new AIService(config);
      const trendCacheService = new TrendCacheService(aiService);
      const trendService = new TrendService(aiService);

      const niches = profile.topNiches.map((n) => n.name);
      const platforms = profile.platforms.map((p) => p.platform);

      // Use cached service for trends (checks cache automatically)
      const fetchedTrends = await trendCacheService.getTrendsForNiches(
        niches,
        platforms,
        forceRefresh
      );
      setTrends(fetchedTrends);

      // Check if we're using cached data
      if (!forceRefresh) {
        const hasFreshCache = await trendCacheService.hasFreshCache(niches);
        setUsingCache(hasFreshCache);
      }

      // Generate content ideas based on top trends
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
    // Load from cache first (fast initial load)
    fetchTrends(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 animate-fade-up">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
              Trending <span className="gradient-text">Content</span>
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl">
              Latest trends and content ideas for your niches
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => fetchTrends(true)}
              disabled={isLoading}
              size="xl"
              className="shadow-colored-lg whitespace-nowrap"
            >
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
            {usingCache && !isLoading && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Loaded from cache (24h)
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="trends" className="space-y-8 animate-fade-up animation-delay-200">
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

          <TabsContent value="trends" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="loading-spinner mb-6"></div>
                <p className="text-gray-600 font-medium text-lg">Discovering trending content...</p>
              </div>
            ) : trends.length === 0 ? (
              <Card variant="glass" className="border-2 border-dashed border-gray-300">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Trends Yet</h3>
                  <p className="text-gray-600 text-lg mb-6">Click the refresh button to discover trending content</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {trends.map((trend, idx) => (
                  <Card
                    key={trend.id}
                    variant="elevated"
                    className="group hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CardContent className="p-8">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-white shadow-colored-lg group-hover:scale-110 transition-transform duration-300">
                            <div className="text-center">
                              <TrendingUp className="w-8 h-8 mx-auto mb-1" />
                              <div className="text-sm font-bold">{trend.trendingScore}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-contentual-pink transition-colors">
                                {trend.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge size="lg" variant="gradient" className="shadow-sm">
                                  {trend.niche.name}
                                </Badge>
                                {trend.platforms.map((platform) => (
                                  <Badge key={platform} variant="secondary" size="lg">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-700 text-lg leading-relaxed mb-6">{trend.description}</p>

                          {trend.hashtags.length > 0 && (
                            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-contentual-pink-50 to-contentual-peach-50 rounded-xl border border-contentual-pink/10">
                              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                                <Hash className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {trend.hashtags.map((tag) => (
                                  <span key={tag} className="px-3 py-1 bg-white rounded-lg text-sm text-contentual-pink font-semibold shadow-xs border border-contentual-pink/10">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ideas" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="loading-spinner mb-6"></div>
                <p className="text-gray-600 font-medium text-lg">Generating content ideas...</p>
              </div>
            ) : contentIdeas.length === 0 ? (
              <Card variant="glass" className="border-2 border-dashed border-gray-300">
                <CardContent className="py-20 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <Zap className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Content Ideas Yet</h3>
                  <p className="text-gray-600 text-lg mb-6">Click the refresh button to generate personalized content ideas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {contentIdeas.map((idea, idx) => (
                  <Card
                    key={idea.id}
                    variant="elevated"
                    className="group hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-2xl font-bold text-gray-800 group-hover:text-contentual-pink transition-colors flex-1">
                          {idea.title}
                        </h3>
                        <Badge
                          size="lg"
                          className={`capitalize whitespace-nowrap ${
                            idea.difficulty === 'beginner'
                              ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 border border-green-200'
                              : idea.difficulty === 'intermediate'
                              ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200'
                              : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {idea.difficulty}
                        </Badge>
                      </div>

                      <p className="text-gray-700 text-lg leading-relaxed">{idea.description}</p>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-700">{idea.timeEstimate} min</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-contentual-peach-50 to-contentual-coral-50 rounded-xl border border-contentual-peach-100">
                          <Zap className="w-5 h-5 text-contentual-peach" />
                          <span className="font-semibold text-contentual-coral">{idea.niche.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {idea.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary" size="lg">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      {idea.steps.length > 0 && (
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                          <p className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">#</span>
                            </div>
                            Steps to Create:
                          </p>
                          <ol className="space-y-3">
                            {idea.steps.slice(0, 3).map((step, stepIdx) => (
                              <li key={stepIdx} className="text-gray-700 flex items-start gap-3 leading-relaxed">
                                <span className="w-6 h-6 bg-contentual-pink/10 text-contentual-pink rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                  {stepIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                            {idea.steps.length > 3 && (
                              <li className="text-gray-500 italic text-sm ml-9">
                                +{idea.steps.length - 3} more steps...
                              </li>
                            )}
                          </ol>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
