// routes/reviews.js
const express       = require('express');
const pool          = require('../db/pool');
const { auth, optionalAuth, notMuted } = require('../middleware/auth');
const router        = express.Router();

// GET /api/reviews  — all reviews (with optional movie_id filter)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { movie_id, user_id, sort = 'recent', limit = 20, offset = 0 } = req.query;
    let sql = `
      SELECT r.*, u.username, u.avatar_url,
             m.title AS movie_title, m.poster AS movie_poster, m.type AS movie_type
      FROM reviews r
      JOIN users  u ON r.user_id  = u.id
      JOIN movies m ON r.movie_id = m.id
      WHERE r.visibility = 'public'
    `;
    const args = [];

    if (movie_id) { sql += ' AND r.movie_id = ?'; args.push(Number(movie_id)); }
    if (user_id)  { sql += ' AND r.user_id  = ?'; args.push(Number(user_id)); }

    const orderMap = { recent: 'r.created_at DESC', likes: 'r.likes_count DESC', rating: 'r.rating DESC' };
    sql += ` ORDER BY ${orderMap[sort] ?? 'r.created_at DESC'} LIMIT ? OFFSET ?`;
    args.push(Number(limit), Number(offset));

    const [rows] = await pool.execute(sql, args);

    // Attach liked status for logged-in user
    if (req.user && rows.length) {
      const ids = rows.map(r => r.id);
      const [liked] = await pool.execute(
        `SELECT review_id FROM review_likes WHERE user_id = ? AND review_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const likedSet = new Set(liked.map(l => l.review_id));
      rows.forEach(r => r.liked = likedSet.has(r.id));
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reviews/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.*, u.username, u.avatar_url,
             m.title AS movie_title, m.poster AS movie_poster
      FROM reviews r
      JOIN users  u ON r.user_id  = u.id
      JOIN movies m ON r.movie_id = m.id
      WHERE r.id = ?`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Review not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews
router.post('/', auth, notMuted, async (req, res) => {
  try {
    const { movie_id, rating, text, mood, quote, is_spoiler, visibility, rewatch } = req.body;
    if (!movie_id || !rating || !text)
      return res.status(400).json({ error: 'movie_id, rating and text are required' });
    if (text.length < 50)
      return res.status(400).json({ error: 'Review must be at least 50 characters' });

    const [result] = await pool.execute(
      `INSERT INTO reviews (movie_id, user_id, rating, text, mood, quote, is_spoiler, visibility, rewatch)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [movie_id, req.user.id, rating, text, mood ?? null, quote ?? null,
       is_spoiler ?? false, visibility ?? 'public', rewatch ?? 5]
    );
    res.status(201).json({ id: result.insertId, message: 'Review published' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/reviews/:id  (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM reviews WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Review not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { rating, text, mood, quote, is_spoiler, visibility, rewatch } = req.body;
    await pool.execute(
      `UPDATE reviews SET rating=?, text=?, mood=?, quote=?, is_spoiler=?, visibility=?, rewatch=? WHERE id=?`,
      [rating, text, mood, quote, is_spoiler, visibility, rewatch, req.params.id]
    );
    res.json({ message: 'Review updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/reviews/:id  (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM reviews WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Review not found' });
    if (rows[0].user_id !== req.user.id && !req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await pool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/reviews/:id/like  — toggle like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const [existing] = await pool.execute(
      'SELECT 1 FROM review_likes WHERE user_id = ? AND review_id = ?',
      [req.user.id, req.params.id]
    );
    if (existing.length) {
      await pool.execute('DELETE FROM review_likes WHERE user_id = ? AND review_id = ?', [req.user.id, req.params.id]);
      await pool.execute('UPDATE reviews SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [req.params.id]);
      res.json({ liked: false });
    } else {
      await pool.execute('INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)', [req.user.id, req.params.id]);
      await pool.execute('UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?', [req.params.id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /api/reviews/:id/report  — report a review
router.post('/:id/report', auth, async (req, res) => {
  try {
    await pool.execute('UPDATE reviews SET reported = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review reported' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;