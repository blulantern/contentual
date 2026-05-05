# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — `next lint` (ESLint with `next/core-web-vitals`)
- `npm run type-check` — `tsc --noEmit` (no `test` script — there is no test framework configured)

There are both `pnpm-lock.yaml` and `package-lock.json` in the repo. `package-lock.json` is the one tracked as modified and matches the `npm` scripts; prefer `npm` unless the user says otherwise.

There is one known pre-existing TS error in `src/lib/ai/context-api.ts:49` (a `TextBlock` shape mismatch from the Anthropic SDK types). It pre-dates this branch — type-check runs are clean apart from it.

## Environment

- `NEXT_PUBLIC_ANTHROPIC_API_KEY` — optional. The key is also configurable in-app via `/settings`, which persists to `localStorage` (`contentual_ai_config`). See `.env.local.example`.
- `NEXT_PUBLIC_AI_FIXTURE_MODE` — `off` (default), `record`, or `replay`. See "Fixture mode" below.
- The Anthropic SDK is called from the browser using `dangerouslyAllowBrowser: true` (see `src/lib/ai/console-api.ts`, `src/lib/ai/context-api.ts`). This is a known development-mode shortcut; if you add production hardening, route calls through Next.js API routes instead.

### Fixture mode

`AIService.generateCompletion` checks `NEXT_PUBLIC_AI_FIXTURE_MODE` (`src/lib/ai/fixture-mode.ts`) and intercepts requests:

- `record` — pass through to the real client, then persist the response to **both** `localStorage` (`contentual_ai_fixtures`) and disk (`fixtures/ai/<hash>.json`, via `POST /api/fixtures`). The hash is `sha256(cacheKey + systemPrompt + prompt + model)` truncated to 16 hex chars.
- `replay` — try `localStorage` first; on miss, rehydrate from disk via `GET /api/fixtures?hash=...`. Throws with the missing hash if neither side has it.
- `off` — bypass the layer entirely.

`testConnection` deliberately bypasses fixture mode and always hits the real API.

The `/api/fixtures` route (`src/app/api/fixtures/route.ts`) is dev-only — it returns 403 when `NODE_ENV === 'production'` and validates `hash` against `^[a-f0-9]{1,64}$` before any filesystem op.

#### Inspecting and managing fixtures

- `src/lib/ai/fixture-store.ts` — browser helpers: `listFixtures` (localStorage snapshot), `listAllFromDisk` (async fetch), `clearFixtures` (clears both), `exportFixtures` / `importFixtures` for JSON round-trip.
- `src/lib/ai/fixtures-fs.ts` — Node-only helpers (`listAllFixtures`, `getFixtureFromDisk`, `findFixturesByCacheKey`). Safe to import from tests; **do not** import from client components — it pulls in `node:fs`.
- `fixtures/ai/*.json` is git-tracked by default so recordings can be shared. Add to `.gitignore` if devs should record their own.
- Re-record after touching any prompt in `src/lib/ai/prompts.ts` — the hash changes and stale fixtures stop matching.

#### Test usage pattern

No test framework is currently installed. When one is added, fixtures can be loaded synchronously without booting the app:

```ts
import { findFixturesByCacheKey } from '@/lib/ai/fixtures-fs';

const [profile] = findFixturesByCacheKey('profile-analysis');
const parsed = JSON.parse(profile.response.content);
```

Services already strip wrapping text via `content.match(/\{[\s\S]*\}/)` before parsing, so a test asserting on real service output should run that same regex (or call the service with a mocked `AIService` whose `generateCompletion` returns `profile.response`).

## Architecture

Next.js 14 App Router app. **There is no backend** — every page is a client component, all state lives in the browser, and AI calls go directly from the browser to Anthropic. The single exception is `/api/fixtures` (dev-only, see Fixture mode).

### Data flow

1. **AI layer** (`src/lib/ai/`) — `AIService` is the single entry point. It dispatches to `ConsoleAPIClient` or `ContextAPIClient` based on `config.provider`. The Context API client adds prompt-caching headers (`anthropic-beta: prompt-caching-2024-07-31`) and attaches `cache_control: { type: 'ephemeral' }` to system prompts and to a per-request "cached context" block looked up from `prompts.ts` by `cacheKey`. All prompts live in `src/lib/ai/prompts.ts` keyed by a `CacheKey` union (`profile-analysis | niche-matching | trend-analysis | weekly-planning | content-ideas`).

2. **Service layer** (`src/lib/services/`):
   - `ProfileService` — initial profile generation. Discards the AI's `confidence` value and re-derives it via `applyCompatibilityScores` (see "Niche compatibility" below).
   - `TrendDictionaryService` (`trend-cache-service.ts`) — persistent trend dictionary, 3h rate-limit + cycle cursor, 24h staleness check for the scheduler.
   - `IdeaService` — content ideas with cache-first lookup keyed by `{niches, platforms}`.
   - `CreatorsService` — single per-niche fetch returning both top influencers AND peer-level similar creators. Used by the profile page when the user manually adds a niche.
   - `PlanService` — weekly plan generation.
   - `CalendarService` — `.ics` export.
   - Pure helpers: `niche-compatibility.ts` (deterministic score) and `trend-normalize.ts` (token canonicalization). No AI calls; safe to import anywhere.

   **Every AI-backed service demands JSON-only responses but still runs `content.match(/\{[\s\S]*\}/)` before `JSON.parse`** to tolerate occasional preamble. Preserve this pattern when adding new ones.

3. **Persistence** (`src/lib/storage/db.ts`) — IndexedDB via Dexie. Current schema is **v3**:
   - `profile` — single creator profile.
   - `weeklyPlans` — generated weekly plans.
   - `trendDictionary` — persistent trend dictionary, compound PK `[nicheId+normalizedKey]`. **Trends accumulate forever** (with a soft cap of 500/niche, LRU evicted by `lastSeenAt`). Indexes: `nicheId`, `lastSeenAt`, `[nicheId+trendingScore]`.
   - `nicheTrendMeta` — `{nicheId, lastFetchedAt, viewCursor, pageSize}`. Tracks the 3h fetch rate-limit and cycle cursor per niche.
   - `contentIdeasCache` — `{cacheKey, nicheIds, platforms, ideas, trendTitlesUsed, generatedAt, expiresAt}`. 24h TTL.

   v2 → v3 upgrade migrates `trendCache` rows into `trendDictionary` via the runtime merge path (`src/lib/storage/db.ts:upgrade`). Old `trends` / `contentIdeas` / `trendCache` tables are dropped on upgrade.

   **When bumping schema:** add a new `version(N).stores(...)` block; never mutate prior versions. The migration callback can read tables defined in the previous schema before they're dropped.

4. **State** (`src/store/`) — Zustand.
   - `profile-store` — mirrors the persisted profile. Actions: `setProfile`, `loadProfile`, `updateNiches`, `setSimilarCreators`, `upsertInfluencerGroup`, `appendSimilarCreators`. Each persists via `saveProfile` and bumps `lastUpdated`.
   - `config-store` — wraps `ConfigManager` (source of truth for AI config; writes to `localStorage`).

   Components call store actions; they do **not** touch `db.ts` or `configManager` directly except where stores already do.

5. **Pages** (`src/app/`):
   - `setup` — collects platforms + survey → calls `ProfileService` → routes to `dashboard`. The survey now requires `contentTopics` and accepts `recentPostTitles` + optional `audience` — these are the highest-signal inputs for niche matching.
   - `dashboard` — overview cards. Mounts `<RefreshScheduler />` which lazily refreshes trends per niche on a 24h schedule.
   - `trends` — reads `trendDictionary` cache-first via `TrendDictionaryService.getView()` for fast first paint. Regenerate button calls `regenerate()` which either fresh-fetches (≥3h since last) or advances the cycle cursor; UI surfaces a banner when `source === 'cycled'` with a countdown to next fresh fetch.
   - `profile` — concise bullet-tidbit layout. Niche cards show a horizontal % bar + matching top influencers as link-out chips. "Edit niches" opens the `NichePicker` modal.
   - `planning`, `settings` — instantiate their service with `new AIService(config)` as needed.

   The home page (`src/app/page.tsx`) gates CTAs on `isConfigured` and `profile`; it uses a `mounted` flag to avoid a hydration mismatch since both come from client-only storage.

### Caching strategy

Three distinct caches:

- **Anthropic prompt caching** — handled inside `ContextAPIClient`, keyed by the `cacheKey` option passed to `aiService.generateCompletion`. The cached blob is the static guidance text in `CACHED_CONTEXTS`. Reused across all calls with the same `cacheKey`.
- **Trend dictionary** (Dexie `trendDictionary` table) — persistent dedupe-and-merge per niche. Trends from successive fetches union into the same record (max trendingScore, joined hashtags/exampleLinks, longest description wins). Read via `TrendDictionaryService.getView()`; written via `regenerate()`.
- **Content ideas cache** (Dexie `contentIdeasCache` table) — keyed by `sha256(sortedNicheIds + '|' + sortedPlatforms)`. **Not** keyed by trend titles — they churn faster than user intent. Top trend titles are stored as metadata on the row; if they diverge from the current top 5 by >2, `staleVsCurrentTrends` is surfaced so the UI can offer a manual refresh banner.

### Trend normalization (dedupe)

`src/lib/services/trend-normalize.ts:normalizeTrendTitle` is the single source of truth for the second half of the `trendDictionary` primary key. It runs: NFKD → strip diacritics → lowercase → strip emoji/punctuation → expand small alias map (`grwm`→`get ready with me`, `ootd`, `pov`, etc.) → drop stopwords → sort tokens → join. Two titles that differ only in case, punctuation, word order, or those abbreviations produce the same key.

### Niche compatibility scoring

The `confidence` value on `NicheMatch` is **not** the AI's number — `ProfileService` discards the AI value and recomputes it via `src/lib/services/niche-compatibility.ts:computeNicheCompatibility`. The same function runs every time the user saves picks in the `NichePicker`, so manually-added niches get an honest match score against the user's stated content (not a flat 100%).

The score is a deterministic [0..100]:
- Tokenize niche name + category and a "haystack" (`contentTopics + recentPostTitles + audience`) using the same normalizer as trend dedupe.
- Name hits weighted heavier than category hits; both-hit bonus.
- Floor 10 for "your content doesn't touch this — yet"; floor 50 when the haystack is empty (no signal to judge).

### Manual niche selection

`src/components/niche-picker/NichePicker.tsx` is a self-contained overlay (search, category-grouped chips, max-5 cap, ESC + backdrop close, body-scroll lock). It returns `NicheMatch[]` on save — kept niches retain their original `confidence`/`reasoning`; new picks get `reasoning: "Manually selected"` and the deterministic score is applied by the parent.

When the picker saves on the profile page (`src/app/profile/page.tsx:handleNichesSave`):
1. `applyCompatibilityScores` runs against the user's survey.
2. `profile.similarCreators` is filtered to drop entries whose niche was deselected.
3. For each newly-added niche missing influencer coverage, a fire-and-forget `CreatorsService.getCreatorsForNiche(name, platforms)` runs. Result feeds `upsertInfluencerGroup` (per-niche top creators) and `appendSimilarCreators` (peer-level entries).
4. Cards show a "Finding top creators…" spinner while pending; other niches render normally.

### Background scheduler

`src/components/scheduler/RefreshScheduler.tsx` is a headless client component mounted in `dashboard/page.tsx` and `trends/page.tsx`. It calls `TrendDictionaryService.refreshIfStale` (24h gate per niche) on mount, every 5 minutes while the tab is open, and on `visibilitychange` becoming visible. No PWA / service-worker — Periodic Sync is Chromium-only and gives uneven UX.

### Niches taxonomy

`src/lib/data/niche-categories.ts` is the canonical niche list. AI prompts reference it via `getNicheCategoriesText()`; services reconcile AI responses by exact `name` match (`getNicheByName`) or by id (`getNicheById`), falling back to `NICHE_CATEGORIES[0]`. Categories include `Lifestyle`, `Beauty`, `Fashion`, `Food`, `Fitness`, `Health`, `Technology`, `Gaming`, `Education`, `Family`, `Sports`, `Automotive`, `Relationships` (ids 211-220, including Dating Advice / Marriage / Online Dating).

Keep prompt text and the data file in sync if you change either.

### URL helpers

`src/lib/data/platforms.ts`:
- `getPlatformUrl(platform, username)` — creator profile URL.
- `hashtagUrl(platform, tag)` — platform-specific tag page (used by trend cards).
- `searchUrl(platform, query)` — platform search results (used by content-idea platform pills).

### Path alias

`@/*` → `./src/*` (`tsconfig.json`). `target` is `es2018` so the trend normalizer's Unicode regex flags compile.

### Styling

Tailwind with custom `contentual-pink/coral/peach/cream` palettes, `font-display` (Space Grotesk) and `font-sans` (Inter), and named gradients (`gradient-primary`, `gradient-hero`, etc.) defined in `tailwind.config.ts`. Reuse these tokens rather than inlining hex values.

## Reference: spec document

`project-management/artifact.md` is a 40k-token spec listing the original 52 intended files with full source. It is the design intent, not necessarily current code — when it disagrees with files under `src/`, the code wins. Diverges substantially from current trend/idea/profile architecture; consult mainly for unfinished surfaces.
