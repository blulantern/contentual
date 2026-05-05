const STORAGE_KEY = 'contentual_ai_fixtures';
const API_PATH = '/api/fixtures';

export interface FixtureRecord {
  cacheKey?: string;
  prompt: string;
  response: { content: string; usage?: any };
  recordedAt: string;
}

type FixtureMap = Record<string, FixtureRecord>;

const readLocal = (): FixtureMap => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocal = (map: FixtureMap): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

const isFixtureRecord = (v: unknown): v is FixtureRecord =>
  !!v && typeof v === 'object' && 'response' in v && 'prompt' in v;

/** Fast path: localStorage. Fallback: rehydrate from disk via dev API. */
export const getFixture = async (hash: string): Promise<FixtureRecord | undefined> => {
  const local = readLocal();
  if (local[hash]) return local[hash];

  if (typeof window === 'undefined') return undefined;
  try {
    const res = await fetch(`${API_PATH}?hash=${encodeURIComponent(hash)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    if (!isFixtureRecord(data)) return undefined;

    local[hash] = data;
    writeLocal(local);
    return data;
  } catch {
    return undefined;
  }
};

/** Writes to localStorage immediately, then best-effort POST to the dev API for durability. */
export const saveFixture = async (hash: string, record: FixtureRecord): Promise<void> => {
  const map = readLocal();
  map[hash] = record;
  writeLocal(map);

  if (typeof window === 'undefined') return;
  try {
    await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash, record }),
    });
  } catch (err) {
    console.warn('[fixture] failed to persist to disk:', err);
  }
};

/** Synchronous snapshot of the localStorage map. Use listAllFromDisk() to fetch the on-disk set. */
export const listFixtures = (): FixtureMap => readLocal();

export const listAllFromDisk = async (): Promise<FixtureMap> => {
  if (typeof window === 'undefined') return {};
  try {
    const res = await fetch(API_PATH);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

export const clearFixtures = async (): Promise<void> => {
  writeLocal({});
  if (typeof window === 'undefined') return;
  try {
    await fetch(API_PATH, { method: 'DELETE' });
  } catch {
    // ignore — disk-side may already be gone
  }
};

export const exportFixtures = (): string => JSON.stringify(readLocal(), null, 2);

export const importFixtures = (json: string): void => {
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid fixtures JSON: expected an object');
  }
  writeLocal(parsed as FixtureMap);
};
