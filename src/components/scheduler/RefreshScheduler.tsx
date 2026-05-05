'use client';

import { useEffect } from 'react';
import { useProfileStore } from '@/store/profile-store';
import { useConfigStore } from '@/store/config-store';
import { AIService } from '@/lib/ai/ai-service';
import { TrendDictionaryService } from '@/lib/services/trend-cache-service';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Headless scheduler: kicks `refreshIfStale` (24h gate) on mount, on every
 * 5-minute tick while mounted, and whenever the tab regains visibility.
 * Failures are warned only — the user-facing UI never blocks on it.
 */
export default function RefreshScheduler() {
  const { profile } = useProfileStore();
  const { config } = useConfigStore();

  useEffect(() => {
    if (!profile) return;

    const aiService = new AIService(config);
    const service = new TrendDictionaryService(aiService);
    const niches = profile.topNiches.map((n) => n.name);
    const platforms = profile.platforms.map((p) => p.platform);

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      service.refreshIfStale(niches, platforms).catch((err) => {
        console.warn('[scheduler] refreshIfStale failed:', err);
      });
    };

    tick();
    const interval = setInterval(tick, FIVE_MINUTES_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [profile, config]);

  return null;
}
