export type FixtureMode = 'off' | 'record' | 'replay';

export const getFixtureMode = (): FixtureMode => {
  const v = process.env.NEXT_PUBLIC_AI_FIXTURE_MODE;
  if (v === 'record' || v === 'replay') return v;
  return 'off';
};

export const hashRequest = async (
  prompt: string,
  systemPrompt: string | undefined,
  cacheKey: string | undefined,
  model: string
): Promise<string> => {
  const input = JSON.stringify({
    prompt,
    systemPrompt: systemPrompt ?? '',
    cacheKey: cacheKey ?? '',
    model,
  });
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
};
