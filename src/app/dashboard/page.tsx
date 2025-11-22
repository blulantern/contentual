'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { TrendCacheService } from '@/lib/services/trend-cache-service';
import { Sparkles, TrendingUp, Calendar, ArrowRight, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loadProfile } = useProfileStore();
  const { config } = useConfigStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile === null) {
      return;
    }
    if (!profile) {
      router.push('/setup');
    }
  }, [profile, router]);

  // Pre-fetch trends in background when dashboard loads
  useEffect(() => {
    if (!profile) return;

    const prefetchTrends = async () => {
      try {
        const aiService = new AIService(config);
        const trendCacheService = new TrendCacheService(aiService);

        const niches = profile.topNiches.map((n) => n.name);
        const platforms = profile.platforms.map((p) => p.platform);

        // Check if we already have fresh cache
        const hasFreshCache = await trendCacheService.hasFreshCache(niches);
        if (!hasFreshCache) {
          console.log('Pre-fetching trends in background...');
          // Run in background (don't await) - silently cache trends
          trendCacheService.prefetchAllNicheTrends(niches, platforms).catch((error) => {
            console.error('Background trend pre-fetch failed:', error);
          });
        } else {
          console.log('Fresh trend cache already exists');
        }
      } catch (error) {
        console.error('Background trend pre-fetch initialization failed:', error);
        // Fail silently - this is a background optimization
      }
    };

    prefetchTrends();
  }, [profile, config]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    {
      label: 'Top Niches',
      value: profile.topNiches.length,
      icon: Sparkles,
      color: 'from-contentual-pink to-contentual-coral',
      bgColor: 'bg-contentual-pink/10',
      textColor: 'text-contentual-pink',
    },
    {
      label: 'Active Platforms',
      value: profile.platforms.length,
      icon: TrendingUp,
      color: 'from-contentual-coral to-contentual-peach',
      bgColor: 'bg-contentual-coral/10',
      textColor: 'text-contentual-coral-800',
    },
    {
      label: 'Weekly Hours',
      value: `${profile.survey.timeCommitment}h`,
      icon: Clock,
      color: 'from-contentual-peach to-contentual-cream',
      bgColor: 'bg-contentual-peach/10',
      textColor: 'text-contentual-peach-800',
    },
  ];

  const quickActions = [
    {
      href: '/profile',
      icon: Sparkles,
      title: 'View Full Profile',
      description: 'See detailed analytics and AI-powered recommendations',
      color: 'from-contentual-pink to-contentual-coral',
    },
    {
      href: '/trends',
      icon: TrendingUp,
      title: 'Discover Trends',
      description: 'Find viral content ideas tailored to your niches',
      color: 'from-contentual-coral to-contentual-peach',
    },
    {
      href: '/planning',
      icon: Calendar,
      title: 'Weekly Plan',
      description: 'Get your personalized content calendar',
      color: 'from-contentual-peach to-contentual-pink',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-3 animate-fade-up">
            Welcome back, <span className="gradient-text">Creator</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg animate-fade-up animation-delay-200">
            Here&apos;s your content strategy overview
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-10">
          {quickStats.map((stat, index) => (
            <Card
              key={index}
              variant="glass"
              className="animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                    <p className={`text-3xl lg:text-4xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-soft`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Overview */}
        <Card variant="glass" className="mb-10 animate-fade-up animation-delay-400">
          <CardHeader>
            <CardTitle>Your Content Profile</CardTitle>
            <CardDescription>
              AI-generated insights based on your content strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-contentual-pink" />
                <h3 className="font-semibold text-gray-900">Top Niches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.topNiches.map((niche, idx) => (
                  <Badge key={idx} variant="default" size="lg">
                    {niche.name}
                    <span className="ml-1.5 opacity-75">({niche.confidence}%)</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-contentual-coral-800" />
                <h3 className="font-semibold text-gray-900">Connected Platforms</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.platforms.map((platform, idx) => (
                  <Badge key={idx} variant="secondary" size="lg">
                    {platform.platform}: @{platform.username}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-2xl font-display font-bold mb-6">Quick Actions</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="block animate-fade-up"
              style={{ animationDelay: `${500 + index * 100}ms` }}
            >
              <Card className="action-card h-full">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 mb-4 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-soft group-hover:shadow-colored transition-all duration-300 group-hover:scale-110`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2 text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="flex items-center text-contentual-pink font-semibold group-hover:gap-3 gap-2 transition-all">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
