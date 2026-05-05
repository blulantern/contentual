/**
 * Node-only helpers for reading recorded AI fixtures off disk.
 * Intended for use from tests (Vitest, Jest, Playwright, etc.) that
 * run outside the browser. Do NOT import from client components — it
 * pulls in `node:fs` and will fail to bundle.
 *
 * Example:
 *   import { findFixturesByCacheKey } from '@/lib/ai/fixtures-fs';
 *   const [profile] = findFixturesByCacheKey('profile-analysis');
 *   const parsed = JSON.parse(profile.response.content);
 */
import fs from 'node:fs';
import path from 'node:path';
import type { FixtureRecord } from './fixture-store';

const FIXTURES_DIR = path.join(process.cwd(), 'fixtures', 'ai');

export const fixturesDir = (): string => FIXTURES_DIR;

export const listAllFixtures = (): Record<string, FixtureRecord> => {
  if (!fs.existsSync(FIXTURES_DIR)) return {};
  const out: Record<string, FixtureRecord> = {};
  for (const file of fs.readdirSync(FIXTURES_DIR)) {
    if (!file.endsWith('.json')) continue;
    const hash = file.replace(/\.json$/, '');
    out[hash] = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8'));
  }
  return out;
};

export const getFixtureFromDisk = (hash: string): FixtureRecord | undefined => {
  const file = path.join(FIXTURES_DIR, `${hash}.json`);
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export const findFixturesByCacheKey = (cacheKey: string): FixtureRecord[] =>
  Object.values(listAllFixtures()).filter((f) => f.cacheKey === cacheKey);
