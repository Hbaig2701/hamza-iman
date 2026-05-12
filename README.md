# ours.

A private shared journal for Hamza & Iman — text, photos, video, voice notes (with auto-transcription), labels, moods, milestones, quotes, daily prompts, a bucket list, countdowns, an "On this day" feed, monthly recaps, and more.

Built with Next.js 14 (App Router) + TypeScript + Tailwind + Prisma + Supabase + OpenAI Whisper.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env template and fill in your secrets
cp .env.example .env

# 3. Push schema to Supabase Postgres
npm run db:push

# 4. Seed default labels and ~100 prompts
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open http://localhost:3000 — pick an identity (Hamza or Iman) and enter the PIN you set in `.env`.

## Required environment variables

| Var | Notes |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server, never expose) |
| `OPENAI_API_KEY` | For Whisper voice transcription |
| `HAMZA_PIN` | 4-digit PIN for Hamza |
| `IMAN_PIN` | 4-digit PIN for Iman |
| `AUTH_SECRET` | Long random string for cookie signing |
| `OPENAI_RECAP_ENABLED` | Set to `true` to enable AI-generated monthly recap summaries |

## Storage buckets

The app uses three Supabase Storage buckets: `photos`, `videos`, `voice-notes`. They should be **public** (URLs are signed by the bucket prefix). You can create them in two ways:

1. **Auto-create on first upload** — the upload helper does not auto-create, so run the helper script once:
   ```bash
   npx tsx prisma/setup-buckets.ts
   ```
2. **Or create them by hand** in the Supabase dashboard (Storage → New bucket, Public).

## Project structure

```
src/
  app/
    page.tsx                  ← Identity selection / PIN entry
    (app)/                    ← Authenticated app shell
      today/                  ← Today page (feed + flashback + prompt + countdowns)
      calendar/               ← Calendar album view (month/year)
      day/[date]/             ← Day detail
      insights/               ← Stats, recaps, favorites, milestones, map, mood, prompts
      quotes/                 ← Quote wall
      bucket/                 ← Bucket list + countdowns
      settings/               ← Labels, PIN info, export, sign out
    api/                      ← All REST endpoints
  components/                 ← UI: composer, day view, calendar, insights, etc.
  lib/                        ← prisma, supabase, auth, openai, storage, utils
  middleware.ts               ← Cookie-based auth gate
prisma/
  schema.prisma               ← Data model
  seed.ts                     ← Default labels + ~100 prompts
  setup-buckets.ts            ← Create Supabase storage buckets
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import in Vercel — framework auto-detected.
3. Set environment variables in the Vercel project settings.
4. Add the `postinstall` script (already in `package.json`) so Prisma generates the client at build time.
5. After first deploy, run the seed once locally (or via Vercel CLI):
   ```bash
   DATABASE_URL=... npm run db:seed
   ```

## Features map

- **Daily journal**: text + photo + video + screenshot + voice note + location + mood + labels + milestone.
- **Voice transcription**: in-browser MediaRecorder → server route → OpenAI Whisper.
- **Calendar album**: photo-grid view of each month, year mosaic, milestone & label badges.
- **Day detail**: same composer/feed as Today but for any historical date.
- **Insights**: streak, totals, mood chart (14-day), monthly recap (optional AI summary), top labels, who journals more.
- **Favorites**: starred entries + quotes, all in one feed.
- **Milestones timeline**: chronological list of marked milestone days.
- **Memory map**: list of all entries with location pins (no map tile API key required — link out to OpenStreetMap).
- **Mood history**: monthly heatmap showing both partners side-by-side.
- **Daily prompt**: one shared prompt per day, hidden until both respond, then revealed.
- **Quote wall**: who said it / who logged it, filters, search.
- **Bucket list**: progress bar, completion tracking, can attach countdowns.
- **Countdowns**: live "days away" counter on Today and Bucket pages.
- **Streak**: consecutive days where either partner journaled, badge in header.
- **Export**: download every record as JSON.

## Auth model

There is no user table. The two identities `hamza` and `iman` are hard-coded; their PINs live in environment variables. Logging in sets a signed HTTP-only cookie that names the active identity. The middleware blocks everything except `/` and `/api/auth/*` for unauthenticated requests.

To switch identities, tap the sign-out icon in the header.

## Privacy

This is a single-tenant app for two people. No telemetry, no third-party tracking, no public sharing. The only outbound calls are to Supabase (your project) and (optionally) OpenAI (voice transcription + recap summaries).

## License

Private. For Hamza & Iman.
