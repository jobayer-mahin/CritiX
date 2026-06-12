// routes/admin.js — Critix Admin API
require('dotenv').config(); // safety net — ensures .env is loaded regardless of import order
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const router  = express.Router();

// ─── JWT Secret — bulletproof fallback ───────────────────────
// Uses .env value when set; falls back to a hardcoded dev secret
// so the server NEVER returns "JWT_SECRET missing" in development.
const JWT_SECRET = process.env.JWT_SECRET || 'critix-dev-fallback-secret-2024';

// ─── Admin Auth Middleware ────────────────────────────────────
function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── POST /api/admin/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Ensure admins table exists (auto-create if missing)
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS admins (
          id            INT AUTO_INCREMENT PRIMARY KEY,
          first_name    VARCHAR(80)  NOT NULL,
          last_name     VARCHAR(80)  NOT NULL,
          email         VARCHAR(120) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableErr) {
      console.error('[ADMIN LOGIN] Could not ensure admins table:', tableErr.message);
      return res.status(500).json({ error: 'Database error: could not verify admins table. Check your MySQL connection and make sure the critix database exists.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    const admin = rows[0];

    if (!admin) {
      console.warn(`[ADMIN LOGIN] No admin found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordOk = await bcrypt.compare(password, admin.password_hash);
    if (!passwordOk) {
      console.warn(`[ADMIN LOGIN] Wrong password for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, firstName: admin.first_name, lastName: admin.last_name, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    const { password_hash, ...safeAdmin } = admin;
    res.json({ token, admin: safeAdmin });
  } catch (err) {
    console.error('[ADMIN LOGIN] Unexpected error:', err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

// ─── GET /api/admin/me ────────────────────────────────────────
router.get('/me', adminAuth, (req, res) => res.json({ admin: req.admin }));

// ═══════════════ MOVIES ═══════════════════════════════════════

// GET /api/admin/movies
router.get('/movies', adminAuth, async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(rows.map(m => ({ ...m, genre: typeof m.genre === 'string' ? JSON.parse(m.genre) : m.genre })));
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/movies
router.post('/movies', adminAuth, async (req, res) => {
  try {
    const { type, title, year, rating, critics, genre, poster, backdrop, director, tagline, synopsis, runtime, popular } = req.body;
    if (!title || !year || !type) return res.status(400).json({ error: 'title, year, type required' });
    const [result] = await pool.execute(
      `INSERT INTO movies (type,title,year,rating,critics,genre,poster,backdrop,director,tagline,synopsis,runtime,popular)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [type, title, year, rating || 0, critics || 0, JSON.stringify(genre || []),
       poster || null, backdrop || null, director || null, tagline || null, synopsis || null, runtime || null, popular || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Movie created' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/movies/:id
router.put('/movies/:id', adminAuth, async (req, res) => {
  try {
    const { type, title, year, rating, critics, genre, poster, backdrop, director, tagline, synopsis, runtime, popular } = req.body;
    await pool.execute(
      `UPDATE movies SET type=?,title=?,year=?,rating=?,critics=?,genre=?,poster=?,backdrop=?,
       director=?,tagline=?,synopsis=?,runtime=?,popular=? WHERE id=?`,
      [type, title, year, rating, critics, JSON.stringify(genre || []),
       poster, backdrop, director, tagline, synopsis, runtime, popular, req.params.id]
    );
    res.json({ message: 'Movie updated' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/movies/:id
router.delete('/movies/:id', adminAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM movies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════ USERS ════════════════════════════════════════

// GET /api/admin/users
router.get('/users', adminAuth, async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, avatar_url, bio, is_banned, is_muted, created_at,
              (SELECT COUNT(*) FROM reviews WHERE user_id = users.id) AS review_count
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { banned } = req.body;
    await pool.execute('UPDATE users SET is_banned = ? WHERE id = ?', [banned ? 1 : 0, req.params.id]);
    res.json({ message: banned ? 'User banned' : 'User unbanned' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/mute
router.patch('/users/:id/mute', adminAuth, async (req, res) => {
  try {
    const { muted } = req.body;
    await pool.execute('UPDATE users SET is_muted = ? WHERE id = ?', [muted ? 1 : 0, req.params.id]);
    res.json({ message: muted ? 'User muted' : 'User unmuted' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════ REVIEWS ══════════════════════════════════════

// GET /api/admin/reviews
router.get('/reviews', adminAuth, async (req, res) => {
  try {
    const { reported } = req.query;
    let sql = `
      SELECT r.*, u.username, u.avatar_url, m.title AS movie_title
      FROM reviews r
      JOIN users  u ON r.user_id  = u.id
      JOIN movies m ON r.movie_id = m.id
    `;
    if (reported === '1') sql += ' WHERE r.reported = 1';
    sql += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', adminAuth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/reviews/:id/dismiss-report
router.patch('/reviews/:id/dismiss-report', adminAuth, async (req, res) => {
  try {
    await pool.execute('UPDATE reviews SET reported = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Report dismissed' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════ DASHBOARD STATS ══════════════════════════════

// GET /api/admin/stats
router.get('/stats', adminAuth, async (_req, res) => {
  try {
    const [[{ movies }]]   = await pool.execute('SELECT COUNT(*) AS movies FROM movies');
    const [[{ users  }]]   = await pool.execute('SELECT COUNT(*) AS users  FROM users');
    const [[{ reviews}]]   = await pool.execute('SELECT COUNT(*) AS reviews FROM reviews');
    const [[{ reported}]]  = await pool.execute('SELECT COUNT(*) AS reported FROM reviews WHERE reported = 1');
    res.json({ movies, users, reviews, reported });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, adminAuth };
