# Contentual

AI-powered content strategy app for social media creators. Connect your platforms, answer a short survey, and Claude generates a niche profile, daily trend feed, content ideas, and a personalized weekly content plan you can export to your calendar.

Built with Next.js 14 (App Router), TypeScript, Tailwind, Zustand, Dexie (IndexedDB), and the Anthropic SDK.

## Features

- **Profile analysis** — match your platforms and survey answers to top niches with confidence scores, similar creators, engagement strategies, and influencer references.
- **Trends feed** — daily trending topics, hashtags, and audio per niche, cached locally for 24 hours.
- **Content ideas** — actionable ideas with steps, equipment, difficulty, and time estimate.
- **Weekly plan** — a 7-day schedule of creation, posting, engagement, and analytics tasks tuned to a full-time or part-time commitment.
- **Calendar export** — download your weekly plan as an `.ics` file.
- **Local-first** — everything is stored in your browser (IndexedDB + localStorage). No server, no account.

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

Then go through **Setup** to generate your profile.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run type-check` | `tsc --noEmit` |

## How it works

The app talks to the Anthropic API directly from the browser using the Anthropic SDK with `dangerouslyAllowBrowser: true`. There is no backend.

- **AI calls** go through `AIService`, which dispatches to either the Console API client or the Context API client (the latter enables Anthropic prompt caching for the static reference data injected into each prompt).
- **Persistence** uses Dexie (IndexedDB) for profile, plans, trends, content ideas, and a 24h trend cache. AI config is in `localStorage`.
- **State** is held in Zustand stores that wrap the persistence layer.
- **Routing** uses the Next.js App Router (`src/app/`); every page is a client component.

> Note: `dangerouslyAllowBrowser` ships your API key to the client. This setup is intended for local/personal use. For production, route Anthropic calls through Next.js API routes instead.

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
  components/     # UI primitives + layout
  lib/
    ai/           # AIService + Console/Context API clients + prompts
    services/     # ProfileService, TrendService, TrendCacheService, PlanService, CalendarService
    storage/      # Dexie schema + helpers
    config/       # AI config manager (localStorage-backed)
    data/         # Niche categories, platform metadata
  store/          # Zustand stores (profile, config)
  types/          # Shared TypeScript types
```

See [`CLAUDE.md`](./CLAUDE.md) for a deeper architectural walkthrough.

## License

Private / unlicensed.
