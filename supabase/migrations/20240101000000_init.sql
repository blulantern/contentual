-- Contentual schema (single-user, no auth).
-- Run this in your Supabase project's SQL editor:
--   1. Create a new Supabase project at https://supabase.com
--   2. Settings → API → copy "Project URL" + "anon/public" key into .env.local
--   3. Open the SQL editor and run this whole file
--
-- All tables are anon-accessible via permissive RLS. Single-user app: anyone
-- with the URL has full access. Do NOT deploy publicly without adding auth.

-- ─── profile ────────────────────────────────────────────────────────────────
-- One row at a time. The full CreatorProfile object lives in `data` JSONB so
-- it can evolve without per-field migrations.

create table if not exists profile (
  id uuid primary key,
  data jsonb not null,
  generated_at timestamptz not null,
  last_updated timestamptz not null
);

-- ─── weekly_plans ───────────────────────────────────────────────────────────

create table if not exists weekly_plans (
  id uuid primary key,
  type text not null,
  week_start timestamptz not null,
  week_end timestamptz not null,
  data jsonb not null
);
create index if not exists weekly_plans_week_start_idx on weekly_plans (week_start);
create index if not exists weekly_plans_week_end_idx on weekly_plans (week_end);

-- ─── trend_dictionary ───────────────────────────────────────────────────────
-- Persistent trend dictionary keyed by (niche_id, normalized_key). Trends
-- accumulate forever; the runtime soft-caps to 500 per niche via LRU on
-- last_seen_at.

create table if not exists trend_dictionary (
  niche_id integer not null,
  normalized_key text not null,
  id uuid not null,
  title text not null,
  description text not null,
  platforms jsonb not null,
  trending_score integer not null default 0,
  hashtags jsonb not null default '[]'::jsonb,
  audio_track text,
  example_links jsonb not null default '[]'::jsonb,
  niche jsonb not null,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  primary key (niche_id, normalized_key)
);
create index if not exists trend_dictionary_niche_idx on trend_dictionary (niche_id);
create index if not exists trend_dictionary_last_seen_idx on trend_dictionary (last_seen_at);
create index if not exists trend_dictionary_niche_score_idx on trend_dictionary (niche_id, trending_score);

-- ─── niche_trend_meta ───────────────────────────────────────────────────────

create table if not exists niche_trend_meta (
  niche_id integer primary key,
  last_fetched_at timestamptz not null,
  view_cursor integer not null default 0,
  page_size integer not null default 10
);

-- ─── content_ideas_cache ────────────────────────────────────────────────────

create table if not exists content_ideas_cache (
  cache_key text primary key,
  niche_ids jsonb not null,
  platforms jsonb not null,
  ideas jsonb not null,
  trend_titles_used jsonb not null,
  generated_at timestamptz not null,
  expires_at timestamptz not null
);
create index if not exists content_ideas_cache_expires_idx on content_ideas_cache (expires_at);

-- ─── Row-level security ─────────────────────────────────────────────────────
-- Single-user app: grant the anon role full access to every table.
-- Add proper auth + per-user policies if you ever expose this publicly.

alter table profile             enable row level security;
alter table weekly_plans        enable row level security;
alter table trend_dictionary    enable row level security;
alter table niche_trend_meta    enable row level security;
alter table content_ideas_cache enable row level security;

-- Drop pre-existing policies first so this script is idempotent.
drop policy if exists "anon all" on profile;
drop policy if exists "anon all" on weekly_plans;
drop policy if exists "anon all" on trend_dictionary;
drop policy if exists "anon all" on niche_trend_meta;
drop policy if exists "anon all" on content_ideas_cache;

create policy "anon all" on profile             for all to anon using (true) with check (true);
create policy "anon all" on weekly_plans        for all to anon using (true) with check (true);
create policy "anon all" on trend_dictionary    for all to anon using (true) with check (true);
create policy "anon all" on niche_trend_meta    for all to anon using (true) with check (true);
create policy "anon all" on content_ideas_cache for all to anon using (true) with check (true);
