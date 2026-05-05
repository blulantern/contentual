/**
 * Pure helpers for canonicalizing trend titles into a stable dedupe key.
 * Used as the second half of the trendDictionary primary key.
 */

const ALIAS_MAP: Record<string, string> = {
  grwm: 'get ready with me',
  grwmm: 'get ready with me',
  ootd: 'outfit of the day',
  pov: 'point of view',
  asmr: 'asmr',
  diy: 'do it yourself',
  vlog: 'vlog',
  haul: 'haul',
  storytime: 'story time',
  q_and_a: 'q and a',
  qna: 'q and a',
};

const stripDiacritics = (s: string): string =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '');

const stripEmojiAndPunct = (s: string): string =>
  // Strip extended pictographic + punctuation. Underscore kept for alias keys.
  s.replace(/[\p{Extended_Pictographic}\p{P}\p{S}]+/gu, ' ');

const expandAliases = (tokens: string[]): string[] =>
  tokens.flatMap((tok) => {
    const expanded = ALIAS_MAP[tok];
    return expanded ? expanded.split(/\s+/) : [tok];
  });

const STOP_TOKENS = new Set(['the', 'a', 'an', 'of', 'to', 'and']);

/**
 * Normalize a trend title to a sorted-token canonical key.
 * Two titles that differ only in case, punctuation, word order,
 * or common abbreviations should produce the same key.
 */
export const normalizeTrendTitle = (title: string): string => {
  const cleaned = stripEmojiAndPunct(stripDiacritics(title.toLowerCase()))
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const tokens = expandAliases(cleaned.split(' '))
    .filter((t) => t.length > 0 && !STOP_TOKENS.has(t));
  return tokens.sort().join(' ');
};
