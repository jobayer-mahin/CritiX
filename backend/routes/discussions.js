// routes/discussions.js
const express       = require('express');
const pool          = require('../db/pool');
const { auth, optionalAuth, notMuted } = require('../middleware/auth');
const router        = express.Router();

// GET /api/discussions
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'recent', limit = 20, offset = 0 } = req.query;
    const orderMap = {
      recent: 'd.created_at DESC',
      likes:  'd.likes_count DESC',
      views:  'd.views DESC',
    };
    const [rows] = await pool.execute(
      `SELECT d.*, u.username, u.avatar_url
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       ORDER BY ${orderMap[sort] ?? 'd.created_at DESC'}
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );

    let parsed = rows.map(d => ({ ...d, tags: typeof d.tags === 'string' ? JSON.parse(d.tags || '[]') : d.tags, liked: false }));

    // Attach liked status for logged-in user
    if (req.user && parsed.length) {
      const ids = parsed.map(d => d.id);
      const [liked] = await pool.execute(
        `SELECT discussion_id FROM discussion_likes WHERE user_id = ? AND discussion_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const likedSet = new Set(liked.map(l => l.discussion_id));
      parsed = parsed.map(d => ({ ...d, liked: likedSet.has(d.id) }));
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/discussions/:id  — view-only fetch, NO view increment here
// View increment is handled by POST /api/discussions/:id/view (intentional visit)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.*, u.username, u.avatar_url
       FROM discussions d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const d = rows[0];
    let liked = false;

    if (req.user) {
      const [likeRows] = await pool.execute(
        'SELECT 1 FROM discussion_likes WHERE user_id = ? AND discussion_id = ?',
        [req.user.id, req.params.id]
      );
      liked = likeRows.length > 0;
    }

    res.json({ ...d, tags: typeof d.tags === 'string' ? JSON.parse(d.tags || '[]') : d.tags, liked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/discussions/:id/view  — intentional view tracking ONLY
// Call this when a user actually opens/views the discussion page.
// Must NOT be called on like, comment, or any other mutation.
router.post('/:id/view', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM discussions WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.execute('UPDATE discussions SET views = views + 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'View counted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/discussions
router.post('/', auth, notMuted, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
    const [result] = await pool.execute(
      'INSERT INTO discussions (user_id, title, body, tags) VALUES (?, ?, ?, ?)',
      [req.user.id, title.trim(), body.trim(), JSON.stringify(tags || [])]
    );
    res.status(201).json({ id: result.insertId, message: 'Discussion created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/discussions/:id/like  — toggle like (idempotent)
router.post('/:id/like', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if like already exists
    const [existing] = await conn.execute(
      'SELECT 1 FROM discussion_likes WHERE user_id = ? AND discussion_id = ?',
      [req.user.id, req.params.id]
    );

    let liked;
    if (existing.length > 0) {
      // Unlike: remove record, decrement count
      await conn.execute(
        'DELETE FROM discussion_likes WHERE user_id = ? AND discussion_id = ?',
        [req.user.id, req.params.id]
      );
      await conn.execute(
        'UPDATE discussions SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
        [req.params.id]
      );
      liked = false;
    } else {
      // Like: insert record, increment count
      await conn.execute(
        'INSERT INTO discussion_likes (user_id, discussion_id) VALUES (?, ?)',
        [req.user.id, req.params.id]
      );
      await conn.execute(
        'UPDATE discussions SET likes_count = likes_count + 1 WHERE id = ?',
        [req.params.id]
      );
      liked = true;
    }

    await conn.commit();

    // Return updated count
    const [updated] = await conn.execute('SELECT likes_count FROM discussions WHERE id = ?', [req.params.id]);
    res.json({ liked, likes_count: updated[0]?.likes_count ?? 0 });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// DELETE /api/discussions/:id  (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM discussions WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.execute('DELETE FROM discussions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
