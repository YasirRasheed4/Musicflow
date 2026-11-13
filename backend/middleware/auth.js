const jwt = require("jsonwebtoken");
const db = require("../db");

// In a real deployment this must come from an environment variable.
// A fixed fallback is fine for local development only.
const JWT_SECRET = process.env.JWT_SECRET || "musicflow-dev-secret-change-me";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Requires a valid token. Rejects the request if missing/invalid.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in to continue" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Your session expired — sign in again" });
  }

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
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // ignore invalid token on optional routes
    }
  }
  next();
}

module.exports = { signToken, requireAuth, optionalAuth, JWT_SECRET };
