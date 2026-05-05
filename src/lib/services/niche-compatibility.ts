import { NicheCategory, CreatorSurvey, NicheMatch } from '@/types/profile';
import { normalizeTrendTitle } from './trend-normalize';

const NO_OVERLAP_FLOOR = 10;
const NEUTRAL_NO_SIGNAL = 50;

const tokens = (s: string): string[] =>
  normalizeTrendTitle(s).split(' ').filter(Boolean);

/**
 * Deterministic [0..100] score expressing how well a niche fits the creator's
 * stated content signal. Replaces the AI-assigned confidence which has been
 * the unreliable bit.
 *
 * Algorithm:
 *  - Tokenize niche.name and niche.category, and the survey "haystack"
 *    (contentTopics + recentPostTitles + audience) using the same normalizer
 *    as trend dedupe (case-fold, strip diacritics/punct, alias expand,
 *    drop stopwords).
 *  - Count name-token hits and category-token hits.
 *  - No hits anywhere → NO_OVERLAP_FLOOR (an honest "your content doesn't
 *    cover this — yet" rather than a falsely-confident 0).
 *  - Some hits → 50 base for any name hit, scales up with hit ratio; a
 *    smaller bump for category hits; small bonus when both fire.
 *  - Empty haystack → NEUTRAL_NO_SIGNAL (we have nothing to judge with).
 */
export const computeNicheCompatibility = (
  niche: Pick<NicheCategory, 'name' | 'category'>,
  survey: CreatorSurvey | undefined
): number => {
  const haystack = [
    survey?.contentTopics ?? '',
    ...(survey?.recentPostTitles ?? []),
    survey?.audience ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!haystack.trim()) return NEUTRAL_NO_SIGNAL;

  const haystackSet = new Set(tokens(haystack));
  const nameTokens = tokens(niche.name);
  if (nameTokens.length === 0) return NO_OVERLAP_FLOOR;

  const nameHits = nameTokens.filter((t) => haystackSet.has(t)).length;
  const categoryTokens = niche.category ? tokens(niche.category) : [];
  const catHits = categoryTokens.filter((t) => haystackSet.has(t)).length;

  if (nameHits === 0 && catHits === 0) return NO_OVERLAP_FLOOR;

  const nameComponent =
    nameHits === 0 ? 0 : 50 + (nameHits / nameTokens.length) * 35;
  const catComponent =
    catHits === 0 || categoryTokens.length === 0
      ? 0
      : 15 + (catHits / categoryTokens.length) * 15;

  const both = nameHits > 0 && catHits > 0 ? 5 : 0;
  const score = Math.max(nameComponent, catComponent) + both;
  return Math.round(Math.max(0, Math.min(100, score)));
};

/** Recompute confidence on a list of niches against the given survey. */
export const applyCompatibilityScores = (
  niches: NicheMatch[],
  survey: CreatorSurvey | undefined
): NicheMatch[] =>
  niches.map((n) => ({
    ...n,
    confidence: computeNicheCompatibility(n, survey),
  }));
