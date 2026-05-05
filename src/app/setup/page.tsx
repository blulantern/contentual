'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PlatformConnectionsForm from '@/components/profile-editor/PlatformConnectionsForm';
import CreatorSurveyForm from '@/components/profile-editor/CreatorSurveyForm';
import { useConfigStore } from '@/store/config-store';
import { useProfileStore } from '@/store/profile-store';
import { AIService } from '@/lib/ai/ai-service';
import { ProfileService } from '@/lib/services/profile-service';
import { PlatformConnection } from '@/types/platforms';
import { CreatorSurvey } from '@/types/profile';
import { Loader2, ArrowRight } from 'lucide-react';

type SetupStep = 'platforms' | 'survey' | 'generating';

const INITIAL_PLATFORMS: PlatformConnection[] = [
  { platform: 'tiktok', username: '', connected: false },
  { platform: 'instagram', username: '', connected: false },
  { platform: 'youtube', username: '', connected: false },
  { platform: 'twitter', username: '', connected: false },
];

const INITIAL_SURVEY: CreatorSurvey = {
  goals: '',
  timeCommitment: 10,
  challenges: [],
  preferredFormats: [],
  equipment: [],
  contentTopics: '',
  recentPostTitles: [],
  audience: '',
};

export default function SetupPage() {
  const router = useRouter();
  const { config, isConfigured } = useConfigStore();
  const { setProfile } = useProfileStore();
  const [step, setStep] = useState<SetupStep>('platforms');
  const [isGenerating, setIsGenerating] = useState(false);

  const [platforms, setPlatforms] = useState<PlatformConnection[]>(INITIAL_PLATFORMS);
  const [survey, setSurvey] = useState<CreatorSurvey>(INITIAL_SURVEY);

  const handleNextToPlatforms = () => {
    const connectedPlatforms = platforms.filter((p) => p.connected);
    if (connectedPlatforms.length === 0) {
      alert('Please connect at least one platform');
      return;
    }
    setStep('survey');
  };

  const handleGenerateProfile = async () => {
    if (!isConfigured) {
      alert('Please configure AI settings first');
      router.push('/settings');
      return;
    }

    if (!survey.goals) {
      alert('Please fill in your goals');
      return;
    }

    if (!survey.contentTopics.trim()) {
      alert('Please describe what your content is about — this drives niche accuracy');
      return;
    }

    setStep('generating');
    setIsGenerating(true);

    try {
      const aiService = new AIService(config);
      const profileService = new ProfileService(aiService);

      const connectedPlatforms = platforms.filter((p) => p.connected);
      const cleanedSurvey: CreatorSurvey = {
        ...survey,
        audience: survey.audience?.trim() || undefined,
      };

      const profile = await profileService.generateProfile(connectedPlatforms, cleanedSurvey);

      setProfile(profile);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to generate profile:', error);
      alert(`Failed to generate profile: ${error.message}`);
      setStep('survey');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 lg:py-20">
        <div className="mb-12 text-center animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 tracking-tight">
            Setup Your <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Let&apos;s create your AI-powered content strategy
          </p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className={`flex items-center gap-2 ${step === 'platforms' ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                step === 'platforms'
                  ? 'bg-gradient-primary text-white shadow-colored'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="hidden sm:inline font-medium text-gray-700">Platforms</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'survey' ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                step === 'survey'
                  ? 'bg-gradient-primary text-white shadow-colored'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="hidden sm:inline font-medium text-gray-700">Survey</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'generating' ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                step === 'generating'
                  ? 'bg-gradient-primary text-white shadow-colored'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="hidden sm:inline font-medium text-gray-700">Generate</span>
            </div>
          </div>
        </div>

        {step === 'platforms' && (
          <Card variant="elevated" className="animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Connect Your Platforms</CardTitle>
              <CardDescription className="text-base">
                Enter your usernames for the platforms you create content on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PlatformConnectionsForm value={platforms} onChange={setPlatforms} />
              <Button onClick={handleNextToPlatforms} className="w-full mt-4 shadow-colored-lg" size="xl">
                Continue to Survey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'survey' && (
          <Card variant="elevated" className="animate-fade-up animation-delay-200">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Creator Survey</CardTitle>
              <CardDescription className="text-base">Tell us about your content creation journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <CreatorSurveyForm value={survey} onChange={setSurvey} />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => setStep('platforms')} variant="secondary" size="xl" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleGenerateProfile} className="flex-1 shadow-colored-lg" size="xl">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Profile
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'generating' && (
          <Card variant="elevated" className="animate-fade-up animation-delay-200">
            <CardContent className="py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">Generating Your Profile</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                AI is analyzing your platforms and creating a personalized content strategy...
              </p>
              <div className="mt-8 flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-contentual-pink rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-contentual-coral rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-3 h-3 bg-contentual-peach rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
