const { Router } = require("express");
const db = require("../db");
const serialize = require("../serialize");
const { requireAuth } = require("../middleware/auth");
const { resolveSpotify } = require("../services/spotify");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();

const TRACK_SELECT = `
  SELECT tracks.*, artists.name AS artist_name, albums.title AS album_title
  FROM tracks
  JOIN artists ON artists.id = tracks.artist_id
  LEFT JOIN albums ON albums.id = tracks.album_id
`;

async function tracksForPlaylist(connection, playlistId) {
  const rows = await connection
    .prepare(
      `${TRACK_SELECT}
       JOIN playlist_tracks ON playlist_tracks.track_id = tracks.id
       WHERE playlist_tracks.playlist_id = ?
       ORDER BY playlist_tracks.sort_order`
    )
    .all(playlistId);
  return rows.map(serialize.track);
}

async function findOrCreateArtist(connection, name) {
  const cleanName = (name || "Unknown Artist").trim();
  let artist = await connection.prepare("SELECT * FROM artists WHERE LOWER(name) = LOWER(?)").get(cleanName);
  if (!artist) {
    const result = await connection
      .prepare("INSERT INTO artists (name, bio, genre_tags) VALUES (?, ?, ?)")
      .run(cleanName, `Artist imported from Spotify`, JSON.stringify(["imported"]));
    artist = await connection.prepare("SELECT * FROM artists WHERE id = ?").get(result.lastInsertRowid);
  }
  return artist;
}

async function findOrCreateAlbum(connection, title, artistId, coverUrl, releaseDate) {
  const cleanTitle = (title || "Single").trim();
  let album = await connection
    .prepare("SELECT * FROM albums WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
    .get(cleanTitle, artistId);
  if (!album) {
    const result = await connection
      .prepare("INSERT INTO albums (title, artist_id, release_date, cover_url, label) VALUES (?, ?, ?, ?, ?)")
      .run(cleanTitle, artistId, releaseDate || new Date().toISOString().slice(0, 10), coverUrl, "Spotify");
    album = await connection.prepare("SELECT * FROM albums WHERE id = ?").get(result.lastInsertRowid);
  }
  return album;
}

async function findOrCreateTrack(connection, { title, artistId, albumId, duration, audioUrl, coverUrl, isExplicit, releaseDate }) {
  const cleanTitle = (title || "Untitled Track").trim();
  let track = await connection
    .prepare("SELECT * FROM tracks WHERE LOWER(title) = LOWER(?) AND artist_id = ?")
    .get(cleanTitle, artistId);

  if (!track) {
    const result = await connection
      .prepare(`
        INSERT INTO tracks
          (title, artist_id, album_id, duration, audio_url, cover_url, genre_tags, mood_tags, is_downloadable, is_explicit, release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        cleanTitle,
        artistId,
        albumId,
        duration || 180,
        audioUrl,
        coverUrl,
        JSON.stringify(["spotify"]),
        JSON.stringify(["imported"]),
        1,
        isExplicit ? 1 : 0,
        releaseDate || new Date().toISOString().slice(0, 10)
      );
    track = await connection.prepare("SELECT * FROM tracks WHERE id = ?").get(result.lastInsertRowid);
  }
  return track;
}

// Preview a Spotify playlist, album, or track before importing
router.post("/preview", asyncHandler(async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify URL or URI" });
  }

  try {
    const preview = await resolveSpotify(url, {
      accessToken: req.get("X-Spotify-Access-Token"),
    });
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to preview Spotify item" });
  }
}));

// Import an entire Spotify playlist
router.post("/import-playlist", requireAuth, asyncHandler(async (req, res) => {
  const { url, name, isPublic } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify playlist URL" });
  }

  try {
    const spotifyData = await resolveSpotify(url, {
      accessToken: req.get("X-Spotify-Access-Token"),
    });
    if (spotifyData.type !== "playlist" && spotifyData.type !== "album") {
      return res.status(400).json({ error: "Provided link is not a playlist or album" });
    }

    const playlistName = (name && name.trim()) || spotifyData.name || "Imported Spotify Playlist";
    const description = spotifyData.description || `Imported from Spotify (${spotifyData.trackCount} tracks)`;

    const playlistId = await db.transaction(async (connection) => {
      const playlistResult = await connection
        .prepare("INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)")
        .run(req.user.id, playlistName, description, isPublic ? 1 : 0);
      const id = playlistResult.lastInsertRowid;
      const insertPlaylistTrack = connection.prepare(
        "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
      );
      for (const [i, t] of spotifyData.tracks.entries()) {
        const artist = await findOrCreateArtist(connection, t.artistName);
        const album = await findOrCreateAlbum(connection, t.albumTitle, artist.id, t.coverUrl, t.releaseDate);
        const track = await findOrCreateTrack(connection, {
          title: t.title,
          artistId: artist.id,
          albumId: album.id,
          duration: t.duration,
          audioUrl: t.audioUrl,
          coverUrl: t.coverUrl,
          isExplicit: t.isExplicit,
          releaseDate: t.releaseDate,
        });
        await insertPlaylistTrack.run(id, track.id, i);
      }
      return id;
    });

    const row = await db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId);
    res.status(201).json({
      playlist: serialize.playlist(row),
      tracks: await tracksForPlaylist(db, playlistId),
      message: `Successfully imported ${spotifyData.tracks.length} tracks!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to import Spotify playlist" });
  }
}));

// Import a single Spotify track
router.post("/import-track", requireAuth, asyncHandler(async (req, res) => {
  const { url, playlistId } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Please provide a Spotify track URL" });
  }

  try {
    const spotifyData = await resolveSpotify(url);
    if (spotifyData.type !== "track") {
      return res.status(400).json({ error: "Provided link is not a single track" });
    }

    const track = await db.transaction(async (connection) => {
      const artist = await findOrCreateArtist(connection, spotifyData.artistName);
      const album = await findOrCreateAlbum(connection, spotifyData.albumTitle, artist.id, spotifyData.coverUrl, spotifyData.releaseDate);
      const createdTrack = await findOrCreateTrack(connection, {
      title: spotifyData.title,
      artistId: artist.id,
      albumId: album.id,
      duration: spotifyData.duration,
      audioUrl: spotifyData.audioUrl,
      coverUrl: spotifyData.coverUrl,
      isExplicit: spotifyData.isExplicit,
      releaseDate: spotifyData.releaseDate,
      });

      if (playlistId) {
        const playlist = await connection.prepare("SELECT * FROM playlists WHERE id = ? AND user_id = ?").get(playlistId, req.user.id);
        if (playlist) {
          const { maxOrder } = await connection
            .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
            .get(playlistId);
          await connection.prepare(
          "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
          ).run(playlistId, createdTrack.id, maxOrder + 1);
        }
      }
      return createdTrack;
    });

    const fullTrack = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(track.id);
    res.status(201).json({
      track: serialize.track(fullTrack),
      message: `Successfully added ${spotifyData.title}!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to import Spotify track" });
  }
}));

// Add a custom song manually
router.post("/custom-track", requireAuth, asyncHandler(async (req, res) => {
  const { title, artistName, albumTitle, audioUrl, coverUrl, duration, playlistId } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Song title is required" });
  }

  try {
    const track = await db.transaction(async (connection) => {
      const artist = await findOrCreateArtist(connection, artistName || "Independent Artist");
      const album = await findOrCreateAlbum(connection, albumTitle || "Single", artist.id, coverUrl || "/covers/neon-tide.png");
      const createdTrack = await findOrCreateTrack(connection, {
      title: title.trim(),
      artistId: artist.id,
      albumId: album.id,
      duration: Number(duration) || 180,
      audioUrl: (audioUrl && audioUrl.trim()) || "/audio/neon-tide.wav",
      coverUrl: (coverUrl && coverUrl.trim()) || "/covers/neon-tide.png",
      isExplicit: false,
      });

      if (playlistId) {
        const playlist = await connection.prepare("SELECT * FROM playlists WHERE id = ? AND user_id = ?").get(playlistId, req.user.id);
        if (playlist) {
          const { maxOrder } = await connection
            .prepare('SELECT COALESCE(MAX(sort_order), -1) AS "maxOrder" FROM playlist_tracks WHERE playlist_id = ?')
            .get(playlistId);
          await connection.prepare(
          "INSERT IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order) VALUES (?, ?, ?)"
          ).run(playlistId, createdTrack.id, maxOrder + 1);
        }
      }
      return createdTrack;
    });

    const fullTrack = await db.prepare(`${TRACK_SELECT} WHERE tracks.id = ?`).get(track.id);
    res.status(201).json({
      track: serialize.track(fullTrack),
      message: `Successfully added ${track.title}!`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to add custom track" });
  }
}));

module.exports = router;
