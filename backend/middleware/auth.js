// middleware/auth.js — JWT verification + role/status middleware
require('dotenv').config();
const jwt  = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'critix-dev-fallback-secret-2024';

// ── auth ─────────────────────────────────────────────────────
// Requires a valid JWT. Blocks with 401 if missing or invalid.
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── optionalAuth ─────────────────────────────────────────────
// Attaches user if token present; continues regardless.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    } catch {}
  }
  next();
}

// ── notBanned ─────────────────────────────────────────────────
// Blocks banned users from all write actions.
// Sets req.userMuted = true for routes that check it (legacy — prefer notMuted below).
async function notBanned(req, res, next) {
  if (!req.user) return next();
  try {
    const [rows] = await pool.execute(
      'SELECT is_banned, is_muted FROM users WHERE id = ?', [req.user.id]
    );
    const u = rows[0];
    if (!u) return next();
    if (u.is_banned) return res.status(403).json({ error: 'Your account has been banned.' });
    if (u.is_muted)  req.userMuted = true;
    next();
  } catch {
    next();
  }
}

// ── notMuted ──────────────────────────────────────────────────
// Blocks muted AND banned users from write actions (posting, commenting, replying, editing, deleting).
// Likes are intentionally exempt — use auth() alone for those.
// Use this middleware on any route a muted user must NOT access.
async function notMuted(req, res, next) {
  if (!req.user) return next();
  try {
    const [rows] = await pool.execute(
      'SELECT is_banned, is_muted FROM users WHERE id = ?', [req.user.id]
    );
    const u = rows[0];
    if (!u) return next();
    if (u.is_banned) return res.status(403).json({ error: 'Your account has been banned.' });
    if (u.is_muted)  return res.status(403).json({ error: 'Your account has been muted. You cannot post or interact.' });
    next();
  } catch {
    next();
  }
}

module.exports = { auth, optionalAuth, notBanned, notMuted };
