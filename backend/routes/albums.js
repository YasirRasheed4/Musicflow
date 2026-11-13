const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const asyncHandler = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = Router();
const MAX_ALBUM_COVER_BYTES = 512 * 1024;

const ALBUM_SELECT = `
  SELECT albums.*, artists.name AS artist_name
  FROM albums
  JOIN artists ON artists.id = albums.artist_id
`;

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

router.get("/albums", asyncHandler(async (req, res) => {
  const rows = await db.prepare(`${ALBUM_SELECT} ORDER BY albums.id`).all();
  res.json({ albums: rows.map(serialize.album) });
}));

router.get("/albums/:id/cover", asyncHandler(async (req, res) => {
  const row = await db.prepare("SELECT cover_url FROM albums WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Album not found" });
  const match = typeof row.cover_url === "string"
    ? row.cover_url.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    : null;
  if (!match) return res.status(404).json({ error: "Uploaded album cover not found" });

  res.set("Content-Type", `image/${match[1]}`);
  res.set("Cache-Control", "no-cache");
  res.send(Buffer.from(match[2], "base64"));
}));

router.get("/albums/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare(`${ALBUM_SELECT} WHERE albums.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Album not found" });
  const tracks = (await db
    .prepare(`${TRACK_SELECT} WHERE tracks.album_id = ? ORDER BY tracks.id`)
    .all(req.params.id))
    .map(serialize.track);
  res.json({ album: serialize.album(row), tracks });
}));

router.post("/albums/:id/playlist", requireAuth, asyncHandler(async (req, res) => {
  const result = await db.transaction(async (connection) => {
    const album = await connection.prepare("SELECT id, title FROM albums WHERE id = ?").get(req.params.id);
    if (!album) return { status: 404 };

    const trackIds = await connection
      .prepare("SELECT id FROM tracks WHERE album_id = ? ORDER BY id")
      .all(album.id);
    if (!trackIds.length) return { status: 409 };

    const existing = await connection.prepare(`
      SELECT playlists.id
      FROM playlists
      WHERE playlists.user_id = ? AND playlists.name = ?
        AND (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = playlists.id) = ?
        AND NOT EXISTS (
          SELECT 1 FROM tracks
          WHERE tracks.album_id = ?
            AND NOT EXISTS (
              SELECT 1 FROM playlist_tracks
              WHERE playlist_tracks.playlist_id = playlists.id
                AND playlist_tracks.track_id = tracks.id
            )
        )
    `).get(req.user.id, album.title, trackIds.length, album.id);
    if (existing) return { playlistId: existing.id, created: false };

    const playlistResult = await connection
      .prepare("INSERT INTO playlists (user_id, name) VALUES (?, ?)")
      .run(req.user.id, album.title);
    const playlistId = playlistResult.lastInsertRowid;
    const insertTrack = connection.prepare(
      "INSERT INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
    );
    for (const [sortOrder, track] of trackIds.entries()) {
      await insertTrack.run(playlistId, track.id, sortOrder);
    }
    return { playlistId, created: true };
  });

  if (result.status === 404) return res.status(404).json({ error: "Album not found" });
  if (result.status === 409) return res.status(409).json({ error: "This album has no songs to add to a playlist" });

  const row = await db.prepare(`
    SELECT playlists.*,
      (SELECT COUNT(*) FROM playlist_tracks WHERE playlist_id = playlists.id) AS track_count,
      (SELECT tracks.cover_url FROM playlist_tracks
       JOIN tracks ON tracks.id = playlist_tracks.track_id
       WHERE playlist_tracks.playlist_id = playlists.id
       ORDER BY playlist_tracks.sort_order LIMIT 1) AS track_cover_url
    FROM playlists
    WHERE playlists.id = ?
  `).get(result.playlistId);
  res.status(result.created ? 201 : 200).json({ playlist: serialize.playlist(row) });
}));

router.patch("/albums/:id", requireAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const hasTitle = Object.prototype.hasOwnProperty.call(body, "title");
  const hasCover = Object.prototype.hasOwnProperty.call(body, "coverUrl");
  if (!hasTitle && !hasCover) {
    return res.status(400).json({ error: "Provide an album name or cover image" });
  }

  let title;
  if (hasTitle) {
    title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "Album name is required" });
  }

  let coverUrl;
  if (hasCover) {
    if (typeof body.coverUrl !== "string") {
      return res.status(400).json({ error: "A valid album cover image is required" });
    }
    const match = body.coverUrl.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) {
      return res.status(400).json({ error: "Album covers must be JPEG, PNG, or WebP images" });
    }
    if (match[1].length > Math.ceil(MAX_ALBUM_COVER_BYTES / 3) * 4) {
      return res.status(413).json({ error: "Album cover images must be 512 KB or smaller after compression" });
    }
    const imageBytes = Buffer.from(match[1], "base64");
    if (!imageBytes.length || imageBytes.toString("base64") !== match[1]) {
      return res.status(400).json({ error: "The album cover image data is invalid" });
    }
    if (imageBytes.length > MAX_ALBUM_COVER_BYTES) {
      return res.status(413).json({ error: "Album cover images must be 512 KB or smaller after compression" });
    }
    coverUrl = body.coverUrl;
  }

  const updated = await db.transaction(async (connection) => {
    const album = await connection.prepare("SELECT id FROM albums WHERE id = ?").get(req.params.id);
    if (!album) return false;
    if (hasTitle) {
      await connection.prepare("UPDATE albums SET title = ? WHERE id = ?").run(title, req.params.id);
    }
    if (hasCover) {
      await connection.prepare("UPDATE albums SET cover_url = ? WHERE id = ?").run(coverUrl, req.params.id);
      await connection
        .prepare("UPDATE tracks SET cover_url = ? WHERE album_id = ?")
        .run(`/api/albums/${req.params.id}/cover`, req.params.id);
    }
    return true;
  });
  if (!updated) return res.status(404).json({ error: "Album not found" });

  const row = await db.prepare(`${ALBUM_SELECT} WHERE albums.id = ?`).get(req.params.id);
  res.json({ album: serialize.album(row) });
}));

router.delete("/albums/:id", requireAuth, asyncHandler(async (req, res) => {
  const album = await db.prepare("SELECT * FROM albums WHERE id = ?").get(req.params.id);
  if (!album) return res.status(404).json({ error: "Album not found" });

  await db.transaction(async (connection) => {
    const trackIds = "(SELECT id FROM tracks WHERE album_id = ?)";
    await connection.prepare(`DELETE FROM favorites WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare(`DELETE FROM playlist_tracks WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare(`DELETE FROM playback_history WHERE track_id IN ${trackIds}`).run(req.params.id);
    await connection.prepare("DELETE FROM rotation_albums WHERE album_id = ?").run(req.params.id);
    await connection.prepare("DELETE FROM tracks WHERE album_id = ?").run(req.params.id);
    await connection.prepare("DELETE FROM albums WHERE id = ?").run(req.params.id);
  });

  res.json({ ok: true, message: `Deleted album ${album.title}` });
}));

module.exports = router;
