const { Router } = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { signToken, requireAuth } = require("../middleware/auth");

const router = Router();

router.post("/signup", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, passwordHash);

  const user = { id: result.lastInsertRowid, name, email, role: "listener" };
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  res.json({ token: signToken(user), user });
});

router.get("/me", requireAuth, (req, res) => {
  const row = db
    .prepare("SELECT id, name, email, role, subscription_status, created_at FROM users WHERE id = ?")
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json({ user: row });
});

module.exports = router;
