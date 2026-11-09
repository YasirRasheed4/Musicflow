const path = require("path");

if (process.env.DB_CLIENT === "sqlite") {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = require("node:sqlite"));
  } catch (error) {
    throw new Error("SQLite mode requires Node.js 22 or later", { cause: error });
  }

  const connection = new DatabaseSync(path.join(__dirname, "musicflow.db"));
  connection.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'listener',
      subscription_status TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bio TEXT,
      genre_tags TEXT,
      cover_url TEXT
    );
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER NOT NULL REFERENCES artists(id),
      release_date TEXT,
      cover_url TEXT,
      label TEXT
    );
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER NOT NULL REFERENCES artists(id),
      album_id INTEGER REFERENCES albums(id),
      duration INTEGER NOT NULL DEFAULT 0,
      audio_url TEXT,
      cover_url TEXT,
      genre_tags TEXT,
      mood_tags TEXT,
      is_downloadable INTEGER NOT NULL DEFAULT 0,
      is_explicit INTEGER NOT NULL DEFAULT 0,
      release_date TEXT
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL REFERENCES playlists(id),
      track_id INTEGER NOT NULL REFERENCES tracks(id),
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playlist_id, track_id)
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id),
      track_id INTEGER NOT NULL REFERENCES tracks(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, track_id)
    );
    CREATE TABLE IF NOT EXISTS playback_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      track_id INTEGER NOT NULL REFERENCES tracks(id),
      played_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      duration_listened INTEGER NOT NULL DEFAULT 0
    );
  `);

  function prepare(sql) {
    const statement = connection.prepare(
      sql.replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, "INSERT OR IGNORE INTO")
    );
    return {
      all(...params) {
        return statement.all(...params);
      },
      get(...params) {
        return statement.get(...params);
      },
      run(...params) {
        const result = statement.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid,
        };
      },
    };
  }

  module.exports = {
    initialize: async () => {},
    prepare,
    exec(sql) {
      return connection.exec(sql);
    },
    transaction(callback) {
      return async (...args) => {
        connection.exec("BEGIN");
        try {
          const result = await callback({ prepare }, ...args);
          connection.exec("COMMIT");
          return result;
        } catch (error) {
          connection.exec("ROLLBACK");
          throw error;
        }
      };
    },
  };
} else {
  const { Pool } = require("pg");
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("Set DATABASE_URL to your PostgreSQL connection string");
  }
  const databaseUrl = new URL(connectionString);
  const allowUnverifiedDatabaseCertificate =
    process.env.DATABASE_SSL_NO_VERIFY === "true" &&
    ["postgres:", "postgresql:"].includes(databaseUrl.protocol);
  if (allowUnverifiedDatabaseCertificate) {
    for (const parameter of ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "sslpassword", "uselibpqcompat"]) {
      databaseUrl.searchParams.delete(parameter);
    }
  }

  const poolConfig = {
    connectionString: databaseUrl.toString(),
    max: Number(process.env.DB_POOL_MAX || 1),
    connectionTimeoutMillis: 10000,
  };
  if (allowUnverifiedDatabaseCertificate) {
    poolConfig.ssl = { rejectUnauthorized: false };
    console.warn("PostgreSQL TLS certificate verification is disabled by DATABASE_SSL_NO_VERIFY");
  }
  const pool = new Pool(poolConfig);
  let initialization;

  function toPostgres(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`).replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, "INSERT INTO");
  }

  function isGeneratedIdInsert(sql) {
    return /^\s*INSERT\s+INTO\s+(users|artists|albums|tracks|playlists|playback_history)\b/i.test(sql);
  }

  async function initialize() {
    if (!initialization) {
      initialization = pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'listener',
          subscription_status TEXT NOT NULL DEFAULT 'free',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS artists (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          bio TEXT,
          genre_tags TEXT,
          cover_url TEXT
        );
        CREATE TABLE IF NOT EXISTS albums (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          artist_id INTEGER NOT NULL REFERENCES artists(id),
          release_date DATE,
          cover_url TEXT,
          label TEXT
        );
        CREATE TABLE IF NOT EXISTS tracks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          artist_id INTEGER NOT NULL REFERENCES artists(id),
          album_id INTEGER REFERENCES albums(id),
          duration INTEGER NOT NULL DEFAULT 0,
          audio_url TEXT,
          cover_url TEXT,
          genre_tags TEXT,
          mood_tags TEXT,
          is_downloadable INTEGER NOT NULL DEFAULT 0,
          is_explicit INTEGER NOT NULL DEFAULT 0,
          release_date DATE
        );
        CREATE TABLE IF NOT EXISTS playlists (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          description TEXT,
          is_public INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS playlist_tracks (
          playlist_id INTEGER NOT NULL REFERENCES playlists(id),
          track_id INTEGER NOT NULL REFERENCES tracks(id),
          sort_order INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (playlist_id, track_id)
        );
        CREATE TABLE IF NOT EXISTS favorites (
          user_id INTEGER NOT NULL REFERENCES users(id),
          track_id INTEGER NOT NULL REFERENCES tracks(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, track_id)
        );
        CREATE TABLE IF NOT EXISTS playback_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          track_id INTEGER NOT NULL REFERENCES tracks(id),
          played_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          duration_listened INTEGER NOT NULL DEFAULT 0
        );
      `);
      initialization = initialization.catch((error) => {
        initialization = undefined;
        throw error;
      });
    }
    await initialization;
  }

  function prepare(sql) {
    return {
      async all(...params) {
        return (await pool.query(toPostgres(sql), params)).rows;
      },
      async get(...params) {
        return (await pool.query(toPostgres(sql), params)).rows[0];
      },
      async run(...params) {
        let query = toPostgres(sql).trim().replace(/;$/, "");
        const ignoresConflict = /\bINSERT\s+IGNORE\s+INTO\b/i.test(sql);
        if (ignoresConflict) query += " ON CONFLICT DO NOTHING";
        const returningId = isGeneratedIdInsert(query);
        if (returningId) query += " RETURNING id";
        const result = await pool.query(query, params);
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0] && result.rows[0].id,
        };
      },
    };
  }

  async function transaction(callback) {
    const client = await pool.connect();
    const tx = {
      async lockSeed() {
        await client.query("SELECT pg_advisory_xact_lock(246813579)");
      },
      prepare(sql) {
        return {
          async all(...params) {
            return (await client.query(toPostgres(sql), params)).rows;
          },
          async get(...params) {
            return (await client.query(toPostgres(sql), params)).rows[0];
          },
          async run(...params) {
            let query = toPostgres(sql).trim().replace(/;$/, "");
            const ignoresConflict = /\bINSERT\s+IGNORE\s+INTO\b/i.test(sql);
            if (ignoresConflict) query += " ON CONFLICT DO NOTHING";
            if (isGeneratedIdInsert(query)) query += " RETURNING id";
            const result = await client.query(query, params);
            return {
              changes: result.rowCount,
              lastInsertRowid: result.rows[0] && result.rows[0].id,
            };
          },
        };
      },
    };
    try {
      await client.query("BEGIN");
      const result = await callback(tx);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  module.exports = {
    initialize,
    prepare,
    transaction,
    close: () => pool.end(),
  };
}
