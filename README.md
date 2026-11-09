# MusicFlow — Full-Stack Starter

A working slice of the MusicFlow PRD: sign up / log in, browse and search a
catalog, play music with a persistent player, favorite tracks, and build
playlists. This is Phase 1 of the PRD's delivery plan (auth, catalog,
search, playback) plus a bit of Phase 2 (playlists, favorites).

## Placeholder content

There's no real licensed audio here yet. `generate_assets.py` procedurally
synthesizes 13 short instrumental clips and generates gradient cover art for
a fictional catalog (4 artists, 5 albums) — no external audio or images are
used anywhere, so there's nothing to license or attribute. When you're ready
to plug in real, licensed tracks, swap the `audio_url` / `cover_url` values
in the database for signed URLs to your own storage (see "Moving toward the
full PRD" below) — the schema and API already support it.

## Stack

| Layer     | This starter                  | Full PRD spec                  |
|-----------|--------------------------------|---------------------------------|
| Frontend  | React + Vite + Tailwind        | React or Next.js                |
| Backend   | Node.js + Express              | Node.js + Express or NestJS     |
| Database  | PostgreSQL in production; SQLite locally | PostgreSQL             |
| Search    | SQL `LIKE` queries              | Meilisearch / Elasticsearch     |
| Storage   | Local static files              | S3-compatible + signed URLs     |
| Auth      | JWT + bcrypt                    | JWT + bcrypt ✓ (same)           |

The backend uses PostgreSQL in production and can use SQLite locally, without
requiring a hosted database during development.

## Regenerating the placeholder catalog

`generate_assets.py` (repo root) writes placeholder media into `backend/audio/`,
`backend/covers/`, and the frontend's `public/audio/` and `public/covers/`.
Re-run it any time you tweak the track list or want a different color palette
for the covers — it needs Python 3 with `numpy` and `Pillow` (`pip install
numpy pillow`), and was built against the DejaVu fonts that ship on most Linux
distros, so cover text rendering may need a different font path on macOS/Windows.

## Setup

Requires Node 22+.

```bash
# 1. Backend
cd backend
npm install
# In PowerShell, select local SQLite before starting or seeding:
$env:DB_CLIENT = "sqlite"
npm run seed      # adds demo data only when the catalog is empty
npm start          # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Open http://localhost:5173. Log in with the seeded demo account:

- **Email:** demo@musicflow.app
- **Password:** demo1234

Or create your own account from the Sign up page.

The demo data is inserted only when the database has no artists. `npm run seed`
does not delete or reset existing data.

## Deploying the full app to Vercel

The root `vercel.json` configures the `backend` Express service and `frontend`
Vite service under one Vercel project and domain. Set the Vercel project's
Root Directory to the repository root (`.`), not `frontend` or `backend`.
Requests to `/api/*` go to the backend; all other paths, including `/audio/*`
and `/covers/*`, go to the frontend. The frontend calls the API through the
same-origin `/api` path, so leave `VITE_API_URL` unset for this deployment.

Install a PostgreSQL database integration such as Neon from Vercel's
Marketplace, connect it to this Vercel project, and make its PostgreSQL
connection URL available to the backend as `DATABASE_URL` or `POSTGRES_URL`.
Set `NODE_ENV=production` and a private `JWT_SECRET` for the backend. On the
first API request, the backend creates its tables and inserts the demo catalog
if the catalog is empty; no SQL import is required. Vercel service bindings
are not needed: the browser calls the public `/api/*` route. Do not use the
local SQLite database for production.

If Supabase's URL causes a `self-signed certificate in certificate chain`
error in Vercel, set `DATABASE_SSL_NO_VERIFY=true` on the backend service and
redeploy. This retains encrypted TLS but disables certificate identity
verification; only use it for the Supabase connection when required.

## What's implemented

- Sign up / log in / session persistence (JWT)
- Browse: home page with editorial playlists, new releases, and a track list
- Search across tracks, albums, and artists
- Playback: persistent player bar, queue, seek, volume, skip — survives page navigation
- Favorites (heart any track)
- Playlists: create, view, add tracks from anywhere, remove tracks, public/private
- Downloads: tracks flagged `is_downloadable` show a direct download link; others don't

## What's not built yet (Phase 2/3 in the PRD)

- Admin panel for managing catalog content
- Artist detail pages (the API route exists at `GET /api/artists/:id`; there's just no page for it yet)
- Real download entitlement tracking / expiry
- Recommendations, analytics, playback history surfaced anywhere in the UI (the `playback_history` table exists but nothing writes to it yet)
- Regional restrictions, admin roles/permissions beyond a `role` column

## Project structure

```
backend/
  db.js               PostgreSQL/SQLite database adapter
  seed.js            Populates the mock catalog + demo account
  server.js           Express app entry point
  middleware/auth.js  JWT sign/verify
  routes/              auth, tracks (+search), albums, artists, playlists, favorites
  audio/, covers/      Generated placeholder media
frontend/
  src/context/         Auth, Player, Favorites, Playlists (React context)
  src/components/       Sidebar, TopBar, MobileNav, PlayerBar, TrackRow, Card, ...
  src/pages/            Home, Search, Library, Login, Signup, AlbumDetail, PlaylistDetail
database/
  musicflow-mysql.sql  Legacy MySQL schema export (not used by Vercel)
```

## Moving toward the full PRD

Roughly in order of what unlocks the most:

1. **Real storage**: put uploaded audio/cover files in S3 (or similar), generate
   signed URLs in the track/album serializers instead of static `/audio/...` paths.
2. **Search**: stand up Meilisearch, index tracks/albums/artists on write,
   swap the `/api/search` handler to query it instead of `LIKE`.
3. **Admin panel**: a protected `/admin` area (check `role === 'admin'` in
   `requireAuth`) for CRUD on artists/albums/tracks.
4. **Downloads**: add a `downloads` table, an entitlement check endpoint, and
   move past direct static-file links.
