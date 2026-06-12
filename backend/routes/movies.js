// routes/movies.js
const express       = require('express');
const pool          = require('../db/pool');
const { auth, optionalAuth } = require('../middleware/auth');
const router        = express.Router();

// Parse genre JSON helper
const parseGenre = (m) => ({ ...m, genre: typeof m.genre === 'string' ? JSON.parse(m.genre) : m.genre });

// GET /api/movies  — with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, genre, sort = 'popular', yearFrom, yearTo, q, limit = 200, offset = 0 } = req.query;
    let sql    = 'SELECT * FROM movies WHERE 1=1';
    const args = [];

    if (type)    { sql += ' AND type = ?';         args.push(type); }
    if (yearFrom){ sql += ' AND year >= ?';         args.push(Number(yearFrom)); }
    if (yearTo)  { sql += ' AND year <= ?';         args.push(Number(yearTo)); }
    if (q)       { sql += ' AND title LIKE ?';      args.push(`%${q}%`); }
    if (genre)   { sql += ' AND JSON_CONTAINS(genre, JSON_QUOTE(?))'; args.push(genre); }

    const orderMap = { popular: 'popular DESC', rating: 'rating DESC', latest: 'year DESC', title: 'title ASC' };
    sql += ` ORDER BY ${orderMap[sort] ?? 'popular DESC'} LIMIT ? OFFSET ?`;
    args.push(Number(limit), Number(offset));

    const [rows] = await pool.execute(sql, args);
    res.json(rows.map(parseGenre));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/movies/featured  — hero carousel pool (MUST be before /:id)
router.get('/featured', async (req, res) => {
  try {
    // Return a randomised pool of up to 12 movies with backdrops so the
    // frontend can apply its own intelligent shuffle / history logic.
    const [rows] = await pool.execute(
      `SELECT * FROM movies
       WHERE backdrop IS NOT NULL AND backdrop != ''
       ORDER BY RAND()
       LIMIT 12`
    );
    // Fall back to any movies if not enough have backdrops
    if (rows.length < 5) {
      const [fallback] = await pool.execute('SELECT * FROM movies ORDER BY popular DESC LIMIT 12');
      res.json(fallback.map(parseGenre));
    } else {
      res.json(rows.map(parseGenre));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/movies/user/watchlist  (current user's watchlist) — MUST be before /:id
router.get('/user/watchlist', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.* FROM movies m
       JOIN watchlist w ON m.id = w.movie_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(parseGenre));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/movies/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Movie not found' });

    const movie = parseGenre(rows[0]);

    // Watchlist status if logged in
    if (req.user) {
      const [wl] = await pool.execute(
        'SELECT 1 FROM watchlist WHERE user_id = ? AND movie_id = ?',
        [req.user.id, req.params.id]
      );
      movie.inWatchlist = wl.length > 0;
    }
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/movies  (admin — add movie)
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, year, rating, critics, genre, poster, backdrop, director, tagline, synopsis, runtime, popular } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO movies (type,title,year,rating,critics,genre,poster,backdrop,director,tagline,synopsis,runtime,popular)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [type,title,year,rating,critics,JSON.stringify(genre),poster,backdrop,director,tagline,synopsis,runtime,popular]
    );
    res.status(201).json({ id: result.insertId, message: 'Movie created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── WATCHLIST ───────────────────────────────────────────────
// POST /api/movies/:id/watchlist
router.post('/:id/watchlist', auth, async (req, res) => {
  try {
    await pool.execute(
      'INSERT IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Added to watchlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/movies/:id/watchlist
router.delete('/:id/watchlist', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
