// server.js — Critix Express Server
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes        = require('./routes/auth');
const movieRoutes       = require('./routes/movies');
const reviewRoutes      = require('./routes/reviews');
const discussionRoutes  = require('./routes/discussions');
const { router: adminRoutes } = require('./routes/admin');

// ── NEW: comment routes ──────────────────────────────────────
const { router: discussionCommentsRouter, commentsRouter } = require('./routes/discussionComments');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logger (dev) ────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/movies',      movieRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/admin',       adminRoutes);

// ── NEW: nested comments under discussions + standalone comment ops ──
app.use('/api/discussions/:id/comments', discussionCommentsRouter);
app.use('/api/comments',                 commentsRouter);

// ─── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── 404 ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀  Critix API running on http://localhost:${PORT}`);
});
