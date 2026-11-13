const assert = require("node:assert/strict");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");

test("stores a full audio file through chunked upload requests", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT);
    CREATE TABLE artists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, bio TEXT, genre_tags TEXT, cover_url TEXT);
    CREATE TABLE albums (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, artist_id INTEGER NOT NULL, release_date TEXT, cover_url TEXT, label TEXT);
    CREATE TABLE tracks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, artist_id INTEGER NOT NULL, album_id INTEGER, duration INTEGER, audio_url TEXT, cover_url TEXT, genre_tags TEXT, mood_tags TEXT, is_downloadable INTEGER DEFAULT 0, is_explicit INTEGER DEFAULT 0, release_date TEXT);
    CREATE TABLE track_audio (track_id INTEGER PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE, content_type TEXT, audio_data BLOB);
    CREATE TABLE track_uploads (id TEXT PRIMARY KEY, user_id INTEGER, file_size INTEGER, chunk_count INTEGER, metadata TEXT, created_at TEXT);
    CREATE TABLE track_upload_chunks (upload_id TEXT REFERENCES track_uploads(id) ON DELETE CASCADE, chunk_index INTEGER, chunk_data BLOB, PRIMARY KEY (upload_id, chunk_index));
    CREATE TABLE playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, description TEXT, cover_url TEXT, is_public INTEGER DEFAULT 0, is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE playlist_tracks (playlist_id INTEGER, track_id INTEGER, sort_order INTEGER, PRIMARY KEY (playlist_id, track_id));
  `);
  sqlite.prepare("INSERT INTO users (id, name, email, role) VALUES (1, ?, ?, ?)")
    .run("Test User", "test@example.com", "listener");

  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql.replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, "INSERT OR IGNORE INTO"));
      return {
        all: async (...params) => statement.all(...params),
        get: async (...params) => statement.get(...params),
        run: async (...params) => statement.run(...params),
      };
    },
    async transaction(callback) {
      sqlite.exec("BEGIN");
      try {
        const result = await callback(db);
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  const dbPath = require.resolve("../db");
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };

  const express = require("express");
  const { signToken } = require("../middleware/auth");
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use("/api", require("./tracks"));
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    sqlite.close();
    delete require.cache[dbPath];
  });

  const token = signToken({ id: 1, name: "Test User", email: "test@example.com", role: "listener" });
  const post = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };

  const metadata = {
    title: "Full Song",
    artistName: "Local Artist",
    albumTitle: "Full Album",
    fileName: "full-song.mp3",
    contentType: "audio/mpeg",
    createPlaylistName: "Full Album",
  };
  const maxSize = 25 * 1024 * 1024;
  const atLimit = await post("/tracks/upload/start", { ...metadata, fileSize: maxSize });
  assert.equal(atLimit.status, 201);
  sqlite.prepare("DELETE FROM track_uploads WHERE id = ?").run(atLimit.body.uploadId);
  const overLimit = await post("/tracks/upload/start", { ...metadata, fileSize: maxSize + 1 });
  assert.equal(overLimit.status, 413);

  const audioData = Buffer.alloc(5 * 1024 * 1024, 17);
  const started = await post("/tracks/upload/start", {
    ...metadata,
    fileSize: audioData.length,
  });
  assert.equal(started.status, 201);

  for (let index = 0; index < audioData.length; index += started.body.chunkSize) {
    const chunkIndex = index / started.body.chunkSize;
    const chunk = audioData.subarray(index, index + started.body.chunkSize);
    const uploaded = await post("/tracks/upload/chunk", {
      uploadId: started.body.uploadId,
      index: chunkIndex,
      base64Data: chunk.toString("base64"),
    });
    assert.equal(uploaded.status, 200);
  }

  const completed = await post("/tracks/upload/complete", { uploadId: started.body.uploadId });
  assert.equal(completed.status, 201);
  const stored = sqlite.prepare("SELECT audio_data FROM track_audio WHERE track_id = ?")
    .get(completed.body.track.id).audio_data;
  assert.equal(Buffer.compare(stored, audioData), 0);
  assert.equal(completed.body.playlist.name, "Full Album");
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) AS count FROM playlist_tracks WHERE playlist_id = ?")
      .get(completed.body.playlist.id).count,
    1
  );
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM track_uploads").get().count, 0);
});
