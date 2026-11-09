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
| Database  | MySQL                          | PostgreSQL                      |
| Search    | SQL `LIKE` queries              | Meilisearch / Elasticsearch     |
| Storage   | Local static files              | S3-compatible + signed URLs     |
| Auth      | JWT + bcrypt                    | JWT + bcrypt ✓ (same)           |

The backend connects to MySQL using environment variables by default. Local
development can use a SQLite database instead, without a MySQL server.

## Regenerating the placeholder catalog

`generate_assets.py` (repo root) wrote everything in `backend/audio/` and
`backend/covers/`. Re-run it any time you tweak the track list or want a
different color palette for the covers — it needs Python 3 with `numpy` and
`Pillow` (`pip install numpy pillow`), and was built against the DejaVu
fonts that ship on most Linux distros, so cover text rendering may need a
different font path on macOS/Windows.

## Setup

Requires Node 18+ for MySQL. SQLite local development requires Node 22+.

```bash
# 1. Backend
cd backend
npm install
# In PowerShell, select local SQLite before starting or seeding:
$env:DB_CLIENT = "sqlite"
npm run seed      # resets and populates the local SQLite database
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

Re-run `npm run seed` any time to reset the catalog back to its original state.

## Setting up MySQL

MySQL remains the default database and is used whenever `DB_CLIENT` is not
set to `sqlite`.

Create a MySQL database and set the variables in `backend/.env` using
`backend/.env.example`. Import `database/musicflow-mysql.sql` with:

```bash
mysql -u YOUR_USER -p YOUR_DATABASE < database/musicflow-mysql.sql
```

The SQL file contains all eight tables and the starter data. Do not upload it
to the website's `htdocs` folder.

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
   db.js              MySQL connection adapter
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
   musicflow-mysql.sql MySQL schema and starter data
```

## Moving toward the full PRD

Roughly in order of what unlocks the most:

1. **Postgres**: swap `db.js` for a `pg` connection; the `CREATE TABLE`
   statements translate almost directly (mainly `AUTOINCREMENT` → `SERIAL`).
2. **Real storage**: put audio/cover files in S3 (or similar), generate
   signed URLs in the track/album serializers instead of static `/audio/...` paths.
3. **Search**: stand up Meilisearch, index tracks/albums/artists on write,
   swap the `/api/search` handler to query it instead of `LIKE`.
4. **Admin panel**: a protected `/admin` area (check `role === 'admin'` in
   `requireAuth`) for CRUD on artists/albums/tracks.
5. **Downloads**: add a `downloads` table, an entitlement check endpoint, and
   move past direct static-file links.
