'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import NichePicker from '@/components/niche-picker/NichePicker';
import PlatformLink from '@/components/platform-link/PlatformLink';
import PlatformsEditModal from '@/components/profile-editor/PlatformsEditModal';
import SurveyEditModal from '@/components/profile-editor/SurveyEditModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { CreatorsService } from '@/lib/services/creators-service';
import { applyCompatibilityScores } from '@/lib/services/niche-compatibility';
import { Users, Target, TrendingUp, ExternalLink, Pencil, Loader2, Link2, ClipboardList } from 'lucide-react';
import { getPlatformUrl, SUPPORTED_PLATFORMS } from '@/lib/data/platforms';
import type {
  CreatorSurvey,
  Influencer,
  NicheMatch,
  SimilarCreator,
} from '@/types/profile';
import type { PlatformConnection } from '@/types/platforms';

const truncate = (s: string, n: number): string =>
  s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;

function SurveyField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    profile,
    loadProfile,
    updateNiches,
    setSimilarCreators,
    upsertInfluencerGroup,
    appendSimilarCreators,
    updatePlatforms,
    updateSurvey,
  } = useProfileStore();
  const { config } = useConfigStore();
  const [nichePickerOpen, setNichePickerOpen] = useState(false);
  const [platformsModalOpen, setPlatformsModalOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [loadingNiches, setLoadingNiches] = useState<Set<string>>(new Set());

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
        <p className="text-gray-600 font-medium">Loading your profile…</p>
      </div>
    );
  }

  // Match each top niche to influencers tagged for that niche
  const influencersForNiche = (nicheName: string): Influencer[] => {
    const group = profile.topInfluencers?.find(
      (g) => g.niche.toLowerCase() === nicheName.toLowerCase()
    );
    return group?.influencers ?? [];
  };

  const handleNichesSave = async (selectedNiches: NicheMatch[]): Promise<void> => {
    // 1. Recompute deterministic compatibility scores from the user's survey.
    const scored = applyCompatibilityScores(selectedNiches, profile.survey);

    // 2. Identify newly added niches (those without existing top-creator coverage).
    const previousByLower = new Set(
      profile.topNiches.map((n) => n.name.toLowerCase())
    );
    const newNicheNames = scored
      .filter((n) => !previousByLower.has(n.name.toLowerCase()))
      .map((n) => n.name);

    // 3. Drop similar creators whose niche is no longer selected.
    const selectedLower = new Set(scored.map((n) => n.name.toLowerCase()));
    const filteredSimilar = (profile.similarCreators ?? []).filter((c) =>
      selectedLower.has((c.niche || '').toLowerCase())
    );

    // 4. Persist the deterministic updates immediately.
    await updateNiches(scored);
    if (filteredSimilar.length !== (profile.similarCreators ?? []).length) {
      await setSimilarCreators(filteredSimilar);
    }

    // 5. For any newly-added niche missing influencer coverage, fire-and-forget
    //    a single AI fetch that returns BOTH top influencers and similar creators
    //    for that niche.
    const platforms = profile.platforms.map((p) => p.platform);
    const aiService = new AIService(config);
    const creatorsService = new CreatorsService(aiService);

    const needsFetch = newNicheNames.filter(
      (name) =>
        !(profile.topInfluencers ?? []).some(
          (g) => g.niche.toLowerCase() === name.toLowerCase()
        )
    );

    if (needsFetch.length === 0) return;

    setLoadingNiches((prev) => {
      const next = new Set(prev);
      needsFetch.forEach((n) => next.add(n));
      return next;
    });

    for (const nicheName of needsFetch) {
      creatorsService
        .getCreatorsForNiche(nicheName, platforms)
        .then(async (result) => {
          if (result.influencers.length > 0) {
            await upsertInfluencerGroup({
              niche: result.niche,
              influencers: result.influencers,
            });
          }
          if (result.similarCreators.length > 0) {
            await appendSimilarCreators(result.similarCreators);
          }
        })
        .catch((err) => {
          console.warn(`Failed to fetch creators for "${nicheName}":`, err);
        })
        .finally(() => {
          setLoadingNiches((prev) => {
            const next = new Set(prev);
            next.delete(nicheName);
            return next;
          });
        });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="mb-10 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-3 tracking-tight">
            Your Creator <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-gray-600 text-lg">{profile.platforms.length} platforms · {profile.topNiches.length} niches</p>
        </div>

        {/* Style / Strengths / Opportunities — fast bullet tidbits */}
        {profile.baselineProfile && (
          <div className="grid md:grid-cols-3 gap-4 mb-10 animate-fade-up animation-delay-200">
            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-contentual-pink mb-3">
                  Content Style
                </h3>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {profile.baselineProfile.contentStyle}
                </p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3">
                  Strengths
                </h3>
                <ul className="space-y-2 text-sm">
                  {profile.baselineProfile.strengths.slice(0, 5).map((s, i) => (
                    <li key={i} className="flex gap-2 text-gray-800 leading-snug">
                      <span className="text-emerald-500 font-bold flex-shrink-0">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-contentual-coral mb-3">
                  Opportunities
                </h3>
                <ul className="space-y-2 text-sm">
                  {profile.baselineProfile.opportunities.slice(0, 5).map((o, i) => (
                    <li key={i} className="flex gap-2 text-gray-800 leading-snug">
                      <span className="text-contentual-coral font-bold flex-shrink-0">↗</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Niches with % bars + top creators in niche */}
        <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-400">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-colored">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  Top Niches
                </CardTitle>
                <CardDescription className="mt-1">
                  Your strongest content categories with similar creators
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNichePickerOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit niches
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {profile.topNiches.map((niche, idx) => {
                const matched = influencersForNiche(niche.name).slice(0, 4);
                const isLoading = loadingNiches.has(niche.name);
                return (
                  <div
                    key={idx}
                    className="p-5 bg-white rounded-2xl border-2 border-contentual-pink/10 hover:border-contentual-pink/30 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{niche.name}</h3>
                      <Badge size="lg" variant="gradient" className="whitespace-nowrap">
                        {niche.confidence}% match
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-primary transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, niche.confidence))}%` }}
                      />
                    </div>
                    {niche.reasoning && (
                      <p className="text-sm text-gray-600 leading-snug mb-3">
                        {truncate(niche.reasoning, 180)}
                      </p>
                    )}
                    {isLoading ? (
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-contentual-pink" />
                        Finding top creators in this niche…
                      </div>
                    ) : matched.length > 0 ? (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                          Top creators in this niche
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matched.map((inf, i) => {
                            const handle = (inf.handle || '').replace(/^@/, '');
                            return handle ? (
                              <PlatformLink
                                key={i}
                                platform={inf.platform}
                                href={getPlatformUrl(inf.platform, handle)}
                                variant="chip"
                                title={`${inf.specialization || inf.name} · ${inf.followersRange}`}
                              >
                                {inf.name}
                              </PlatformLink>
                            ) : (
                              <span
                                key={i}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700"
                              >
                                {inf.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Similar Creators — compact, linked */}
        {profile.similarCreators && profile.similarCreators.length > 0 && (
          <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-colored">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Similar Creators
              </CardTitle>
              <CardDescription>Creators with overlapping content strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.similarCreators.map((creator: SimilarCreator, idx) => {
                  const handle = (creator.handle || '').replace(/^@/, '');
                  return (
                    <div
                      key={idx}
                      className="p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-contentual-coral/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        {handle ? (
                          <PlatformLink
                            platform={creator.platform}
                            href={getPlatformUrl(creator.platform, handle)}
                            variant="inline"
                            title={`${creator.name} on ${creator.platform}`}
                            className="text-base"
                          >
                            {creator.name}
                          </PlatformLink>
                        ) : (
                          <span className="font-bold text-base text-gray-900">
                            {creator.name}
                          </span>
                        )}
                        <Badge variant="secondary" size="sm">
                          {creator.platform}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {creator.followerCount} · {creator.niche}
                      </p>
                      <p className="text-sm text-gray-700 mb-3 leading-snug">
                        {creator.contentStyle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {creator.keySuccessFactors.slice(0, 3).map((factor, i) => (
                          <Badge key={i} variant="accent" size="sm">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <NichePicker
          open={nichePickerOpen}
          currentNiches={profile.topNiches}
          onClose={() => setNichePickerOpen(false)}
          onSave={handleNichesSave}
        />

        {/* Connected Platforms */}
        <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-[700ms]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-colored">
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  Connected Platforms
                </CardTitle>
                <CardDescription className="mt-1">
                  Add, edit, or disconnect your social handles.
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setPlatformsModalOpen(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit platforms
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_PLATFORMS.map((p) => {
                const conn = profile.platforms.find((x) => x.platform === p);
                if (conn && conn.username) {
                  return (
                    <PlatformLink
                      key={p}
                      platform={p}
                      href={getPlatformUrl(p, conn.username.replace(/^@/, ''))}
                      variant="chip"
                      title={`Open @${conn.username.replace(/^@/, '')} on ${p}`}
                    >
                      @{conn.username.replace(/^@/, '')}
                    </PlatformLink>
                  );
                }
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm bg-gray-50 border border-gray-200 text-gray-400 capitalize"
                  >
                    <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-gray-400 bg-gray-200">
                      —
                    </span>
                    {p} · not connected
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Your Survey */}
        <Card variant="elevated" className="mb-8 animate-fade-up animation-delay-[750ms]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-contentual-peach to-contentual-pink rounded-2xl flex items-center justify-center shadow-colored">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  Your Survey
                </CardTitle>
                <CardDescription className="mt-1">
                  Source signal for your niche matches. Updating these refreshes match scores.
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSurveyModalOpen(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit survey
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <SurveyField label="Content topics">
              <p className="text-gray-800 leading-snug">
                {profile.survey.contentTopics
                  ? truncate(profile.survey.contentTopics, 280)
                  : <span className="text-gray-400 italic">Not set</span>}
              </p>
            </SurveyField>

            {profile.survey.recentPostTitles.length > 0 && (
              <SurveyField label="Recent posts">
                <ul className="space-y-1.5 text-sm text-gray-800">
                  {profile.survey.recentPostTitles.map((t, i) => (
                    <li key={i} className="flex gap-2 leading-snug">
                      <span className="text-contentual-pink font-bold flex-shrink-0">·</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </SurveyField>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              {profile.survey.audience && (
                <SurveyField label="Audience">
                  <p className="text-gray-800 text-sm">{profile.survey.audience}</p>
                </SurveyField>
              )}
              <SurveyField label="Time commitment">
                <p className="text-gray-800 text-sm">{profile.survey.timeCommitment} hours / week</p>
              </SurveyField>
            </div>

            {profile.survey.challenges.length > 0 && (
              <SurveyField label="Challenges">
                <div className="flex flex-wrap gap-1.5">
                  {profile.survey.challenges.map((c, i) => (
                    <Badge key={i} variant="secondary" size="sm">{c}</Badge>
                  ))}
                </div>
              </SurveyField>
            )}

            {profile.survey.preferredFormats.length > 0 && (
              <SurveyField label="Preferred formats">
                <div className="flex flex-wrap gap-1.5">
                  {profile.survey.preferredFormats.map((f, i) => (
                    <Badge key={i} variant="secondary" size="sm">{f}</Badge>
                  ))}
                </div>
              </SurveyField>
            )}

            {profile.survey.equipment.length > 0 && (
              <SurveyField label="Equipment">
                <div className="flex flex-wrap gap-1.5">
                  {profile.survey.equipment.map((e, i) => (
                    <Badge key={i} variant="secondary" size="sm">{e}</Badge>
                  ))}
                </div>
              </SurveyField>
            )}

            {profile.survey.goals && (
              <SurveyField label="Goals">
                <p className="text-sm text-gray-700 leading-snug">
                  {truncate(profile.survey.goals, 240)}
                </p>
              </SurveyField>
            )}
          </CardContent>
        </Card>

        <PlatformsEditModal
          open={platformsModalOpen}
          currentPlatforms={profile.platforms}
          onClose={() => setPlatformsModalOpen(false)}
          onSave={async (next: PlatformConnection[]) => {
            await updatePlatforms(next);
          }}
        />

        <SurveyEditModal
          open={surveyModalOpen}
          currentSurvey={profile.survey}
          onClose={() => setSurveyModalOpen(false)}
          onSave={async (next: CreatorSurvey) => {
            await updateSurvey(next);
          }}
        />

        {/* Engagement Strategies — compact */}
        {profile.engagementStrategies && profile.engagementStrategies.length > 0 && (
          <Card variant="elevated" className="animate-fade-up animation-delay-[800ms]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-contentual-peach to-contentual-coral rounded-2xl flex items-center justify-center shadow-colored">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                Engagement Strategies
              </CardTitle>
              <CardDescription>Platform-specific tactics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.engagementStrategies.map((strategy, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-orange-50 to-peach-50 rounded-2xl border border-orange-100"
                  >
                    <h3 className="font-bold capitalize text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-orange-400 to-contentual-peach rounded-md flex items-center justify-center text-white text-[10px] font-bold">
                        {strategy.platform.charAt(0).toUpperCase()}
                      </span>
                      {strategy.platform}
                    </h3>
                    <ul className="space-y-1.5 text-sm">
                      {strategy.strategies.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex gap-2 text-gray-700 leading-snug">
                          <span className="text-contentual-peach font-bold flex-shrink-0">·</span>
                          <span>{s}</span>
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
