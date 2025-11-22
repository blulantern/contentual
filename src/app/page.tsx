'use client';

import Link from 'next/link';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Calendar, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { isConfigured } = useConfigStore();
  const { profile, loadProfile } = useProfileStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [loadProfile]);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Analysis',
      description: 'Claude AI analyzes your social presence and identifies your top niches with precision',
      color: 'from-contentual-pink to-contentual-coral',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Trend Intelligence',
      description: 'Stay ahead with daily trending content and viral video ideas tailored to you',
      color: 'from-contentual-coral to-contentual-peach',
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'Weekly Planning',
      description: 'Get personalized content calendars that fit your schedule and goals',
      color: 'from-contentual-peach to-contentual-pink',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Platform Optimization',
      description: 'Maximize engagement with algorithm-specific strategies for each platform',
      color: 'from-contentual-pink to-contentual-peach',
    },
  ];

  const benefits = [
    'Save 10+ hours per week on content planning',
    'Increase engagement with data-driven insights',
    'Never run out of content ideas',
    'Multi-platform optimization built-in',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative hero-gradient min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-contentual-pink/20 rounded-full blur-3xl animate-bounce-subtle" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-contentual-peach/20 rounded-full blur-3xl animation-delay-400 animate-bounce-subtle" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-contentual-pink/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-contentual-pink" />
            <span className="text-sm font-semibold text-gray-700">Powered by Claude AI</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-up animation-delay-200 text-balance">
            Transform Your Content
            <br />
            <span className="gradient-text">Strategy with AI</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-up animation-delay-400">
            AI-powered content strategy that analyzes your presence, tracks trends, and delivers
            personalized weekly plans to maximize your engagement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up animation-delay-600">
            {!mounted ? (
              // Server-side / initial render - show default
              <Link href="/setup">
                <Button size="lg" className="group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : !isConfigured ? (
              <Link href="/setup">
                <Button size="lg" className="group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : profile ? (
              <Link href="/dashboard">
                <Button size="lg" className="group">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/setup">
                <Button size="lg" className="group">
                  Complete Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}

            <Link href="/settings">
              <Button variant="secondary" size="lg">
                Configure AI Settings
              </Button>
            </Link>
          </div>

          {/* Benefits List */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100 animate-fade-up"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <CheckCircle2 className="w-5 h-5 text-contentual-pink flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Everything You Need to <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to supercharge your content creation workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-card border border-gray-100 hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mb-6 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white shadow-soft group-hover:shadow-colored transition-all duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32 px-4 bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-shine opacity-50" />
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
            Ready to Level Up Your Content?
          </h2>
          <p className="text-lg md:text-xl mb-10 opacity-95 max-w-2xl mx-auto">
            Join thousands of creators who are transforming their content strategy with AI-powered insights
          </p>
          <Link href="/setup">
            <Button size="xl" className="group bg-white text-contentual-pink hover:bg-gray-50 shadow-2xl">
              Start Creating Smarter
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
