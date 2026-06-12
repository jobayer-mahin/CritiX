// routes/discussionComments.js — Comments & Replies for Discussion posts
// ─────────────────────────────────────────────────────────────────────
// Routes:
//   GET    /api/discussions/:id/comments          – list all comments + replies
//   POST   /api/discussions/:id/comments          – create a top-level comment
//   POST   /api/discussions/:id/comments/:cid/replies  – reply to a comment
//   PUT    /api/comments/:cid                     – edit own comment/reply
//   DELETE /api/comments/:cid                     – soft-delete own comment/reply

const express    = require('express');
const pool       = require('../db/pool');
const { auth, optionalAuth, notMuted } = require('../middleware/auth');

const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent

// ── Sanitize helper (strips HTML tags to prevent XSS) ──────────────
function sanitize(str) {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!lt;|gt;|amp;|quot;|#\d+;)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .trim();
}

// ── GET /api/discussions/:id/comments ──────────────────────────────
// Returns flat list; client groups replies under parent.
router.get('/', optionalAuth, async (req, res) => {
  const discussionId = Number(req.params.id);
  try {
    // Fetch comments and replies in one query; order: top-level by created_at ASC,
    // replies nested underneath their parent in the same order.
    const [rows] = await pool.execute(
      `SELECT
         c.id,
         c.discussion_id,
         c.parent_id,
         c.body,
         c.is_deleted,
         c.created_at,
         c.updated_at,
         u.id        AS user_id,
         u.username,
         u.avatar_url
       FROM discussion_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.discussion_id = ?
       ORDER BY
         COALESCE(c.parent_id, c.id) ASC,   -- group replies under parent
         c.parent_id IS NOT NULL ASC,         -- parent before replies
         c.created_at ASC`,
      [discussionId]
    );

    // Mask deleted comment bodies but keep them so reply threads stay intact
    const cleaned = rows.map(r => ({
      ...r,
      body: r.is_deleted ? '[comment deleted]' : r.body,
    }));

    res.json(cleaned);
  } catch (err) {
    console.error('GET comments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/discussions/:id/comments ─────────────────────────────
router.post('/', auth, notMuted, async (req, res) => {
  const discussionId = Number(req.params.id);
  const userId       = req.user.id;
  const body         = sanitize(req.body.body || '');

  if (!body || body.length < 1)  return res.status(400).json({ error: 'Comment cannot be empty' });
  if (body.length > 2000)        return res.status(400).json({ error: 'Comment too long (max 2000 chars)' });

  // Verify discussion exists
  const [disc] = await pool.execute('SELECT id FROM discussions WHERE id = ?', [discussionId]);
  if (!disc[0]) return res.status(404).json({ error: 'Discussion not found' });

  try {
    const [result] = await pool.execute(
      'INSERT INTO discussion_comments (discussion_id, user_id, parent_id, body) VALUES (?, ?, NULL, ?)',
      [discussionId, userId, body]
    );

    // Bump the replies counter on the discussion
    await pool.execute(
      'UPDATE discussions SET replies = replies + 1 WHERE id = ?',
      [discussionId]
    );

    // Return the new comment with user info
    const [newComment] = await pool.execute(
      `SELECT c.id, c.discussion_id, c.parent_id, c.body, c.is_deleted, c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM discussion_comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error('POST comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/discussions/:id/comments/:cid/replies ────────────────
router.post('/:cid/replies', auth, notMuted, async (req, res) => {
  const discussionId = Number(req.params.id);
  const parentId     = Number(req.params.cid);
  const userId       = req.user.id;
  const body         = sanitize(req.body.body || '');

  if (!body || body.length < 1)  return res.status(400).json({ error: 'Reply cannot be empty' });
  if (body.length > 2000)        return res.status(400).json({ error: 'Reply too long (max 2000 chars)' });

  try {
    // Verify parent comment exists and belongs to this discussion
    const [parent] = await pool.execute(
      'SELECT id, parent_id, discussion_id FROM discussion_comments WHERE id = ? AND discussion_id = ?',
      [parentId, discussionId]
    );
    if (!parent[0]) return res.status(404).json({ error: 'Parent comment not found' });

    // Enforce max 1 level of nesting — replies always attach to a top-level comment
    const actualParentId = parent[0].parent_id ?? parentId;

    const [result] = await pool.execute(
      'INSERT INTO discussion_comments (discussion_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)',
      [discussionId, userId, actualParentId, body]
    );

    await pool.execute(
      'UPDATE discussions SET replies = replies + 1 WHERE id = ?',
      [discussionId]
    );

    const [newReply] = await pool.execute(
      `SELECT c.id, c.discussion_id, c.parent_id, c.body, c.is_deleted, c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM discussion_comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newReply[0]);
  } catch (err) {
    console.error('POST reply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/comments/:cid ─────────────────────────────────────────
// Separate router exported for /api/comments/:cid  (see server.js)
const commentsRouter = express.Router();

commentsRouter.put('/:cid', auth, notMuted, async (req, res) => {
  const commentId = Number(req.params.cid);
  const userId    = req.user.id;
  const body      = sanitize(req.body.body || '');

  if (!body || body.length < 1)  return res.status(400).json({ error: 'Comment cannot be empty' });
  if (body.length > 2000)        return res.status(400).json({ error: 'Comment too long (max 2000 chars)' });

  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id, is_deleted FROM discussion_comments WHERE id = ?',
      [commentId]
    );
    if (!rows[0])            return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (rows[0].is_deleted)  return res.status(400).json({ error: 'Cannot edit a deleted comment' });

    await pool.execute(
      'UPDATE discussion_comments SET body = ? WHERE id = ?',
      [body, commentId]
    );

    const [updated] = await pool.execute(
      `SELECT c.id, c.discussion_id, c.parent_id, c.body, c.is_deleted, c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM discussion_comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [commentId]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error('PUT comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/comments/:cid ──────────────────────────────────────
commentsRouter.delete('/:cid', auth, notMuted, async (req, res) => {
  const commentId = Number(req.params.cid);
  const userId    = req.user.id;

  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id FROM discussion_comments WHERE id = ?',
      [commentId]
    );
    if (!rows[0])            return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Soft-delete so reply threads stay intact
    await pool.execute(
      'UPDATE discussion_comments SET is_deleted = 1 WHERE id = ?',
      [commentId]
    );

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('DELETE comment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export both routers
module.exports = { router, commentsRouter };
