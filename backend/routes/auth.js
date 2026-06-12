// routes/auth.js
require('dotenv').config();
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db/pool');
const { auth } = require('../middleware/auth');
const router   = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'critix-dev-fallback-secret-2024';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hash]
    );
    const user = { id: result.insertId, username: username.trim(), email };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username or email already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    const { password_hash, ...safeUser } = user;
    res.json({ token: makeToken(user), user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me  (requires token)
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, display_name, email, avatar_url, bio, is_muted, is_banned, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/me  (update profile)
router.patch('/me', auth, async (req, res) => {
  try {
    const { bio, avatar_url, username, display_name } = req.body;

    // Check username uniqueness if changing
    if (username) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username.trim(), req.user.id]
      );
      if (existing.length > 0)
        return res.status(409).json({ error: 'Username already taken' });
    }

    await pool.execute(
      'UPDATE users SET bio = ?, avatar_url = ?, username = COALESCE(?, username), display_name = ? WHERE id = ?',
      [bio ?? null, avatar_url ?? null, username ? username.trim() : null, display_name ?? null, req.user.id]
    );

    // Return updated user
    const [rows] = await pool.execute(
      'SELECT id, username, display_name, email, avatar_url, bio, is_muted, is_banned, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Profile updated', user: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users/:id  (public user profile)
router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users/:id/reviews
router.get('/users/:id/reviews', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.username, u.display_name, u.avatar_url, m.title as movie_title, m.poster as movie_poster
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN movies m ON r.movie_id = m.id
       WHERE r.user_id = ? AND r.visibility = 'public'
       ORDER BY r.created_at DESC LIMIT 20`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users/:id/followers
router.get('/users/:id/followers', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.display_name, u.avatar_url FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users/:id/following
router.get('/users/:id/following', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.display_name, u.avatar_url FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/users/:id/follow
router.post('/users/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId == req.user.id)
      return res.status(400).json({ error: 'Cannot follow yourself' });

    await pool.execute(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [req.user.id, targetId]
    );

    // Create notification for the followed user
    const [me] = await pool.execute('SELECT username, display_name FROM users WHERE id = ?', [req.user.id]);
    const name = me[0]?.display_name || me[0]?.username || 'Someone';
    await pool.execute(
      'INSERT INTO notifications (user_id, type, message, from_user_id) VALUES (?, ?, ?, ?)',
      [targetId, 'follow', `${name} started following you`, req.user.id]
    );

    res.json({ message: 'Followed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/auth/users/:id/follow
router.delete('/users/:id/follow', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Unfollowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.*, u.username as from_username, u.avatar_url as from_avatar
       FROM notifications n
       LEFT JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/notifications/read
router.patch('/notifications/read', auth, async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Marked all as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
