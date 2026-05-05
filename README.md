# Contentual

AI-powered content strategy app for social media creators. Connect your platforms, answer a short survey, and Claude generates a niche profile, daily trend feed, content ideas, and a personalized weekly content plan you can export to your calendar.

Built with Next.js 14 (App Router), TypeScript, Tailwind, Zustand, Supabase (Postgres), Dexie (IndexedDB cache), and the Anthropic SDK.

## Features

- **Profile analysis** — your survey answers (content topics, recent post titles, audience) drive niche matches. Each niche gets a deterministic compatibility score, top influencers in that niche, and links to their platform profiles.
- **Choose your own niches** — open the niche picker to add or remove from a 150+ niche taxonomy. New picks fetch top influencers + similar creators on the fly. Removed niches drop their similar-creator entries automatically.
- **Persistent trend dictionary** — trends accumulate per niche over time (deduped by canonicalized title). Click Regenerate: a fresh fetch runs at most once per 3 hours per niche; in between, the regenerate button cycles you through more cached trends with a "next fresh fetch in 1h 22m" indicator. A 24h background scheduler keeps niches from going stale.
- **Linked-out trends and ideas** — hashtags open the platform's tag page; example handles open the creator's profile; content-idea platform pills open a search for the idea on that platform.
- **Cache-first reads** — every persistence read checks IndexedDB first for instant paint, falling back to Supabase only on miss. Writes go to Supabase first (durable), then mirror to the local cache.
- **Edit profile post-setup** — connected platforms and survey responses are editable from the profile page; no need to redo the wizard.
- **Expandable steps** — every idea's step list expands inline to show all steps, not just the first three.
- **Weekly plan** — 7-day schedule of creation, posting, engagement, and analytics tasks tuned to your time commitment.
- **Calendar export** — download your weekly plan as an `.ics` file.
- **Fixture mode** — record real Anthropic responses to disk and replay them, so iterating on UI doesn't burn tokens.

## Quick start

Requires Node.js, npm, and (for local Supabase) Docker.

```bash
npm install
cp .env.local.example .env.local
```

You need two things wired up:

### 1. Anthropic API key

Set `NEXT_PUBLIC_ANTHROPIC_API_KEY` in `.env.local`, or enter it in the in-app **Settings** page.

### 2. Supabase

Pick one of:

#### Option A — Local Supabase (Recommended for development)

Runs the whole Supabase stack (Postgres + auth + studio) on your machine via Docker. Your data stays local; no cloud account needed.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Start the stack and apply the migration:
   ```bash
   npm run db:start
   ```
   First boot pulls Docker images and runs the migrations in `supabase/migrations/` (creates the schema, indexes, and permissive RLS policies). Subsequent starts are fast.
3. Copy the **API URL** and **anon key** that `db:start` prints into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (They're stable across restarts of the same project.)
4. Visit Supabase Studio at the **Studio URL** the CLI printed (default `http://127.0.0.1:54323`) to inspect data.
5. Useful follow-ups: `npm run db:stop` (shut everything down), `npm run db:reset` (wipe and re-run migrations), `npm run db:studio` (open Studio).

#### Option B — Hosted Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Settings → API → copy the Project URL and the **anon public** key into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. Open the Supabase SQL editor and run `supabase/migrations/20240101000000_init.sql` (the same migration the local CLI applies).

> ⚠️ The schema grants permissive RLS to the `anon` role — anyone with the deployed URL has full read/write access. Fine for a personal local app; do **not** deploy publicly without first adding auth + per-user policies.

### 3. Run it

```bash
npm run dev
```

Open http://localhost:3000 and go through **Setup** to generate your profile. The survey asks for your actual content topics and recent post titles — these are the strongest signals for niche matching. Your platforms and survey can be edited later from the profile page without re-running setup.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:start` | Start the local Supabase stack via Docker (first run pulls images + applies migrations) |
| `npm run db:stop` | Stop the local Supabase stack |
| `npm run db:reset` | Drop the local DB and re-run all migrations from scratch |
| `npm run db:studio` | Open Supabase Studio in the browser |

There is one known pre-existing TS error in `src/lib/ai/context-api.ts:49` (Anthropic SDK type mismatch). It does not affect runtime.

## How it works

The app talks to the Anthropic API directly from the browser using the Anthropic SDK with `dangerouslyAllowBrowser: true`. There is no application backend, except for a dev-only `/api/fixtures` route used by Fixture mode. Persistence is provided by Supabase Postgres (local or hosted).

- **AI calls** go through `AIService`, which dispatches to either the Console API client or the Context API client (the latter enables Anthropic prompt caching for the static reference data injected into each prompt).
- **Persistence** is two-layer:
  - **Source of truth: Supabase Postgres** tables (`profile`, `weekly_plans`, `trend_dictionary`, `niche_trend_meta`, `content_ideas_cache`). Schema lives in `supabase/migrations/`. Survives across browsers and devices.
  - **Speed cache: IndexedDB / Dexie**, mirroring the Supabase tables in their TS shape. Every read checks the cache first; every write goes to Supabase first then mirrors to the cache. The cache is best-effort — failures (Safari private mode, quota errors) are swallowed silently.
- **State** is held in Zustand stores that wrap the persistence layer.
- **Routing** uses the Next.js App Router (`src/app/`); every page is a client component.

> Note: `dangerouslyAllowBrowser` ships your API key to the client. This setup is intended for local/personal use. For production, route Anthropic calls through Next.js API routes instead.

## Trend layer behavior

- Trends per niche are stored forever in `trend_dictionary` (soft cap: 500 per niche, LRU evicted by `last_seen_at`). Successive fetches **merge** into the existing dictionary — they don't replace.
- Dedupe key is a canonicalized title: `normalizeTrendTitle()` does NFKD → strip diacritics/punct/emoji → expand a small abbreviation map (GRWM, OOTD, POV, etc.) → drop stopwords → sort tokens. Two titles that differ only in case, punctuation, word order, or those abbreviations collapse into one record.
- The Regenerate button is rate-limited to one fresh AI fetch per 3 hours per niche. Within that window, repeat clicks advance a per-niche cursor and serve the next page of cached trends with a banner explaining the cooldown.
- A headless `RefreshScheduler` mounted on the dashboard runs `refreshIfStale` on mount, every 5 minutes while the tab is open, and on tab refocus. Niches >24h old get a fresh fetch in the background.

## Niche compatibility

The match-percentage on each niche is a deterministic score (`src/lib/services/niche-compatibility.ts`), not the AI's confidence value. It scores the niche name + category against a haystack built from your survey (`contentTopics + recentPostTitles + audience`):

- Tokenized with the same normalizer as trend dedupe.
- Name-token hits weighted heavier than category hits; bonus when both fire.
- Floor of 10 when nothing overlaps (an honest "your content doesn't touch this — yet" signal for manually picked niches that don't match your stated content).
- Floor of 50 when the survey haystack is empty.

The scorer runs both at AI profile generation and on every save in the niche picker, so manually-added niches get a real score.

## Fixture mode

Set `NEXT_PUBLIC_AI_FIXTURE_MODE` to control AI calls:

- `off` (default) — normal behavior.
- `record` — pass through to the real API, save the response to both `localStorage` and `fixtures/ai/<hash>.json` on disk.
- `replay` — read from cache; if missing, rehydrate from disk; throw with the missing hash if neither has it.

Hash key includes `cacheKey + systemPrompt + prompt + model`, so recordings are stable across runs but invalidate when prompts change. `testConnection()` always hits the real API regardless of mode.

After changing any prompt, set `record`, exercise the affected page once, then switch back to `replay` to develop offline.

## Configuration

AI behavior is controlled from the Settings page or by editing `src/lib/config/config-manager.ts`:

- `provider` — `console-api` or `context-api` (the latter enables prompt caching)
- `model` — defaults to `claude-sonnet-4-5-20250929`
- `maxTokens`, `temperature`
- `enableCaching`, `cacheTTL`

## License

Private / unlicensed.
