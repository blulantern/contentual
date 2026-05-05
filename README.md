# Contentual

AI-powered content strategy app for social media creators. Connect your platforms, answer a short survey, and Claude generates a niche profile, daily trend feed, content ideas, and a personalized weekly content plan you can export to your calendar.

Built with Next.js 14 (App Router), TypeScript, Tailwind, Zustand, Dexie (IndexedDB), and the Anthropic SDK.

## Features

- **Profile analysis** — your survey answers (content topics, recent post titles, audience) drive niche matches. Each niche gets a deterministic compatibility score, top influencers in that niche, and links to their platform profiles.
- **Choose your own niches** — open the niche picker to add or remove from a 150+ niche taxonomy. New picks fetch top influencers + similar creators on the fly. Removed niches drop their similar-creator entries automatically.
- **Persistent trend dictionary** — trends accumulate per niche over time (deduped by canonicalized title). Click Regenerate: a fresh fetch runs at most once per 3 hours per niche; in between, the regenerate button cycles you through more cached trends with a "next fresh fetch in 1h 22m" indicator. A 24h background scheduler keeps niches from going stale.
- **Linked-out trends and ideas** — hashtags open the platform's tag page; example handles open the creator's profile; content-idea platform pills open a search for the idea on that platform.
- **Cache-first content ideas** — first paint is instant from IndexedDB; the AI is only re-queried when you click Regenerate or the cached trend set has shifted significantly.
- **Expandable steps** — every idea's step list expands inline to show all steps, not just the first three.
- **Weekly plan** — 7-day schedule of creation, posting, engagement, and analytics tasks tuned to your time commitment.
- **Calendar export** — download your weekly plan as an `.ics` file.
- **Local-first** — everything in your browser (IndexedDB + localStorage). No server, no account, no telemetry.
- **Fixture mode** — record real Anthropic responses to disk and replay them, so iterating on UI doesn't burn tokens.

## Quick start

Requires Node.js and npm.

```bash
npm install
cp .env.local.example .env.local   # optional — you can also enter the key in-app
npm run dev
```

Open http://localhost:3000.

You'll need an Anthropic API key. Either:

- Set `NEXT_PUBLIC_ANTHROPIC_API_KEY` in `.env.local`, or
- Enter it in the in-app **Settings** page (saved to `localStorage`).

Then go through **Setup** to generate your profile. The survey now asks for your actual content topics and recent post titles — these are the strongest signals for niche matching.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run type-check` | `tsc --noEmit` |

There is one known pre-existing TS error in `src/lib/ai/context-api.ts:49` (Anthropic SDK type mismatch). It does not affect runtime.

## How it works

The app talks to the Anthropic API directly from the browser using the Anthropic SDK with `dangerouslyAllowBrowser: true`. There is no backend, except for a dev-only `/api/fixtures` route used by Fixture mode.

- **AI calls** go through `AIService`, which dispatches to either the Console API client or the Context API client (the latter enables Anthropic prompt caching for the static reference data injected into each prompt).
- **Persistence** uses Dexie (IndexedDB) for profile, weekly plans, the persistent trend dictionary (`trendDictionary`), per-niche trend metadata (`nicheTrendMeta`), and content-ideas cache (`contentIdeasCache`). AI config + recorded fixtures live in `localStorage`.
- **State** is held in Zustand stores that wrap the persistence layer.
- **Routing** uses the Next.js App Router (`src/app/`); every page is a client component.

> Note: `dangerouslyAllowBrowser` ships your API key to the client. This setup is intended for local/personal use. For production, route Anthropic calls through Next.js API routes instead.

## Trend layer behavior

- Trends per niche are stored forever in IndexedDB (soft cap: 500 per niche, LRU evicted by `lastSeenAt`). Successive fetches **merge** into the existing dictionary — they don't replace.
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

## Project structure

```
src/
  app/            # App Router pages (setup, dashboard, trends, planning, profile, settings)
                  # + /api/fixtures (dev-only, for record/replay)
  components/
    ui/           # button, card, input, label, badge, tabs
    layout/       # Header
    niche-picker/ # NichePicker modal (manual niche selection)
    scheduler/    # RefreshScheduler (headless 24h refresh)
  lib/
    ai/           # AIService + Console/Context API clients, prompts, fixture-mode/store/fs
    services/     # ProfileService, TrendDictionaryService, IdeaService,
                  # CreatorsService, PlanService, CalendarService
                  # + pure helpers: niche-compatibility, trend-normalize
    storage/      # Dexie schema + helpers (profile, weeklyPlans, trendDictionary,
                  # nicheTrendMeta, contentIdeasCache)
    config/       # AI config manager (localStorage-backed)
    data/         # Niche taxonomy (150+ niches across 13 categories), platform URL helpers
  store/          # Zustand stores (profile with niche/creator actions, config)
  types/          # Shared TypeScript types
fixtures/ai/      # Recorded AI responses (git-tracked by default)
```

See [`CLAUDE.md`](./CLAUDE.md) for the deeper architectural walkthrough and contributor notes.

## License

Private / unlicensed.
