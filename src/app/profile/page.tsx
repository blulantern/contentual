'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileStore } from '@/store/profile-store';
import { Users, Target, TrendingUp } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loadProfile } = useProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile === null) return;
    if (!profile) router.push('/setup');
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="mb-12 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            Your Creator <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl">
            AI-generated insights about your content strategy
          </p>
        </div>

        {/* Baseline Profile */}
        {profile.baselineProfile && (
          <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 text-lg leading-relaxed">{profile.baselineProfile.summary}</p>

              <div className="p-6 bg-gradient-card rounded-2xl border border-contentual-pink/10">
                <h3 className="font-bold text-xl mb-3 text-gray-800">Content Style</h3>
                <p className="text-gray-700 leading-relaxed">{profile.baselineProfile.contentStyle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {profile.baselineProfile.strengths.map((strength, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-3 leading-relaxed">
                        <span className="text-green-500 font-bold text-lg flex-shrink-0 mt-0.5">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                  <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">↗</span>
                    </div>
                    Opportunities
                  </h3>
                  <ul className="space-y-3">
                    {profile.baselineProfile.opportunities.map((opp, idx) => (
                      <li key={idx} className="text-gray-700 flex items-start gap-3 leading-relaxed">
                        <span className="text-contentual-pink font-bold text-lg flex-shrink-0 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Niches */}
        <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-colored">
                <Target className="w-6 h-6 text-white" />
              </div>
              Top Niches
            </CardTitle>
            <CardDescription className="text-base">Your most relevant content categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.topNiches.map((niche, idx) => (
                <div
                  key={idx}
                  className="group p-6 bg-gradient-to-br from-white to-contentual-pink-50 rounded-2xl border-2 border-contentual-pink/10 hover:border-contentual-pink/30 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-800">{niche.name}</h3>
                    <Badge size="lg" variant="gradient" className="shadow-sm">
                      {niche.confidence}% match
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{niche.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Similar Creators */}
        {profile.similarCreators && profile.similarCreators.length > 0 && (
          <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-12 h-12 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-colored">
                  <Users className="w-6 h-6 text-white" />
                </div>
                Similar Creators
              </CardTitle>
              <CardDescription className="text-base">Creators with similar content strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {profile.similarCreators.map((creator, idx) => (
                  <div
                    key={idx}
                    className="group p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-contentual-coral/30 transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{creator.name}</h3>
                      <Badge variant="secondary" size="lg">{creator.platform}</Badge>
                    </div>
                    <p className="text-sm font-medium text-contentual-coral mb-2">{creator.followerCount} followers</p>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">{creator.contentStyle}</p>
                    <div className="flex flex-wrap gap-2">
                      {creator.keySuccessFactors.map((factor, i) => (
                        <Badge key={i} variant="accent" size="sm" className="shadow-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement Strategies */}
        {profile.engagementStrategies && profile.engagementStrategies.length > 0 && (
          <Card variant="elevated" className="animate-fade-up animation-delay-[800ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-12 h-12 bg-gradient-to-br from-contentual-peach to-contentual-coral rounded-2xl flex items-center justify-center shadow-colored">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Engagement Strategies
              </CardTitle>
              <CardDescription className="text-base">Platform-specific recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {profile.engagementStrategies.map((strategy, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gradient-to-br from-orange-50 to-peach-50 rounded-2xl border-2 border-orange-100"
                  >
                    <h3 className="font-bold text-xl mb-4 capitalize text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-contentual-peach rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{strategy.platform.charAt(0).toUpperCase()}</span>
                      </div>
                      {strategy.platform}
                    </h3>
                    <ul className="space-y-3">
                      {strategy.strategies.map((strat, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-3 leading-relaxed">
                          <span className="text-contentual-peach font-bold text-lg flex-shrink-0 mt-0.5">•</span>
                          <span>{strat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
