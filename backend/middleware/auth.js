const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const db = require("../db");

// In a real deployment this must come from an environment variable.
// A fixed fallback is fine for local development only.
const JWT_SECRET = process.env.JWT_SECRET || "musicflow-dev-secret-change-me";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function displayNameFor(authUser) {
  return (
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split("@")[0] ||
    "MusicFlow listener"
  );
}

async function getLocalUserForSupabaseToken(token) {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("Supabase token validation failed:", error.message);
    return null;
  }
  if (!data.user?.email) return null;

  const authUser = data.user;
  const email = authUser.email;
  let row = await db
    .prepare("SELECT id, name, email, role, subscription_status, created_at FROM users WHERE LOWER(email) = LOWER(?)")
    .get(email);

  if (!row) {
    const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
    try {
      await db
        .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
        .run(displayNameFor(authUser), email, passwordHash);
    } catch (insertError) {
      // Another request may have provisioned the same account concurrently.
      row = await db
        .prepare("SELECT id, name, email, role, subscription_status, created_at FROM users WHERE LOWER(email) = LOWER(?)")
        .get(email);
      if (!row) throw insertError;
    }
    if (!row) {
      row = await db
        .prepare("SELECT id, name, email, role, subscription_status, created_at FROM users WHERE LOWER(email) = LOWER(?)")
        .get(email);
    }
  }

  return row
    ? { id: row.id, name: row.name, email: row.email, role: row.role }
    : null;
}

// Requires a valid token. Rejects the request if missing/invalid.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in to continue" });

  let authenticatedUser;
  try {
    authenticatedUser = jwt.verify(token, JWT_SECRET);
  } catch {
    try {
      authenticatedUser = await getLocalUserForSupabaseToken(token);
    } catch {
      authenticatedUser = null;
    }
    if (!authenticatedUser) {
      return res.status(401).json({ error: "Your session expired — sign in again" });
    }
  }
  req.user = authenticatedUser;

  try {
    const user = await db.prepare("SELECT id FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(401).json({ error: "Your account is no longer available" });
    return next();
  } catch (error) {
    return next(error);
  }
}

// Attaches req.user if a valid token is present, but never blocks the request.
// Used on public routes that behave slightly differently when logged in.
async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      try {
        req.user = await getLocalUserForSupabaseToken(token);
      } catch {
        // Ignore invalid or unavailable sessions on optional routes.
      }
    }
  }
  next();
}

function isSupabaseConfigured() {
  return Boolean(supabase);
}

module.exports = { signToken, requireAuth, optionalAuth, isSupabaseConfigured, JWT_SECRET };
