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
    prepare,
    exec(sql) {
      return connection.exec(sql);
    },
    pragma(sql) {
      return connection.exec(`PRAGMA ${sql}`);
    },
    transaction(callback) {
      return (...args) => {
        connection.exec("BEGIN");
        try {
          const result = callback(...args);
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
  const SyncMySQL = require("sync-mysql");
  function getMySQLConfig() {
    if (process.env.DATABASE_URL) {
      let databaseUrl;
      try {
        databaseUrl = new URL(process.env.DATABASE_URL);
      } catch (error) {
        throw new Error("DATABASE_URL must be a valid MySQL connection URL", { cause: error });
      }

      if (!["mysql:", "mysql2:"].includes(databaseUrl.protocol)) {
        throw new Error("DATABASE_URL must use the mysql:// or mysql2:// protocol");
      }

      const database = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ""));
      const user = decodeURIComponent(databaseUrl.username);
      const password = decodeURIComponent(databaseUrl.password);
      if (!databaseUrl.hostname || !database || !user) {
        throw new Error("DATABASE_URL must include a host, database name, and username");
      }

      const config = {
        host: databaseUrl.hostname,
        database,
        user,
        password,
        port: Number(databaseUrl.port || 3306),
        timeout: 10000,
        multipleStatements: true,
      };
      const sslMode = databaseUrl.searchParams.get("ssl-mode")?.toUpperCase();
      if (databaseUrl.searchParams.get("ssl") === "true" || (sslMode && sslMode !== "DISABLED")) {
        config.ssl = {};
      }
      return config;
    }

    const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length) {
      throw new Error(
        `Set DATABASE_URL or provide all MySQL environment variables: ${required.join(", ")}`
      );
    }

    return {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 3306),
      timeout: 10000,
      multipleStatements: true,
    };
  }

  const connection = new SyncMySQL(getMySQLConfig());

  function prepare(sql) {
    return {
      all(...params) {
        return connection.query(sql, params);
      },
      get(...params) {
        return connection.query(sql, params)[0] || undefined;
      },
      run(...params) {
        const result = connection.query(sql, params);
        return {
          changes: result.affectedRows || 0,
          lastInsertRowid: result.insertId,
        };
      },
    };
  }

  module.exports = {
    prepare,
    exec(sql) {
      return connection.query(sql);
    },
    pragma() {},
    transaction(callback) {
      return (...args) => {
        connection.query("START TRANSACTION");
        try {
          const result = callback(...args);
          connection.query("COMMIT");
          return result;
        } catch (error) {
          connection.query("ROLLBACK");
          throw error;
        }
      };
    },
  };
}
