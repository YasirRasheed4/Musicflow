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
