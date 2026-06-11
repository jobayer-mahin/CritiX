// src/pages/MovieDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moviesAPI, reviewsAPI } from '../api/client';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';
import { MovieDetailSkeleton, ReviewGridSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavHint } from '../context/NavHintContext';

export default function MovieDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { showToast }  = useToast();
  const { isLoggedIn } = useAuth();
  const { setHint }    = useNavHint();

  const [movie, setMovie]      = useState(null);
  const [reviews, setReviews]  = useState([]);
  const [inWatchlist, setInWL] = useState(false);
  const [loading, setLoading]  = useState(true);
  const [revLoading, setRevL]  = useState(true);

  useEffect(() => {
    setLoading(true); setRevL(true);
    moviesAPI.getById(id)
      .then(r => {
        setMovie(r.data);
        setInWL(r.data.inWatchlist ?? false);
        // Tell the navbar which section this content belongs to
        setHint(r.data.type === 'tv' ? '/tv' : '/movies');
      })
      .catch(() => navigate('/movies'))
      .finally(() => setLoading(false));
    reviewsAPI.getAll({ movie_id: id, limit: 10 })
      .then(r => setReviews(r.data))
      .catch(console.error)
      .finally(() => setRevL(false));
    // Clear hint when leaving detail page
    return () => setHint(null);
  }, [id]);

  const toggleWatchlist = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      if (inWatchlist) {
        await moviesAPI.removeWatchlist(id);
        setInWL(false);
        showToast('Removed from watchlist');
      } else {
        await moviesAPI.addWatchlist(id);
        setInWL(true);
        showToast('Added to watchlist! ❤️');
      }
    } catch { showToast('Could not update watchlist', 'error'); }
  };

  if (loading) return <MovieDetailSkeleton />;
  if (!movie) return null;

  let genreList = [];
  try {
    genreList = Array.isArray(movie.genre)
      ? movie.genre
      : JSON.parse(movie.genre || '[]');
  } catch { genreList = []; }

  return (
    <main>
      {/* ── Backdrop ── */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden', marginTop: 'var(--nav-height)' }}>
        <img src={movie.backdrop} alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(13,13,13,.55) 50%, rgba(13,13,13,.15) 100%)' }} />
      </div>

      {/* ── Main content ── */}
      <div className="container" style={{ marginTop: -200, position: 'relative', zIndex: 2, paddingBottom: 'var(--space-8)' }}>

        {/* Hero info row */}
        <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', marginBottom: 'var(--space-10)', flexWrap: 'wrap' }}>
          {/* Poster */}
          <div style={{ width: 180, flexShrink: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.7)', border: '2px solid rgba(255,255,255,.08)' }}>
            <img src={movie.poster} alt={movie.title} style={{ width: '100%', display: 'block' }} />
          </div>

          {/* Text info */}
          <div style={{ flex: 1, minWidth: 280, paddingBottom: 'var(--space-2)' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
              <span className={`badge ${movie.type === 'tv' ? 'badge-tv' : 'badge-movie'}`}>
                {movie.type === 'tv' ? 'TV Show' : 'Film'}
              </span>
              <span className="badge badge-fresh">{movie.critics}% Fresh</span>
              {genreList.map(g => (
                <span key={g} className="badge" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{g}</span>
              ))}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-2)' }}>
              {movie.title}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)', fontStyle: 'italic' }}>
              {movie.tagline}
            </p>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
              {[
                ['Rating',   `★ ${movie.rating}`, 'var(--accent-orange)'],
                ['Year',     movie.year,           null],
                ['Runtime',  movie.runtime,        null],
                ['Director', movie.director,       'var(--accent-green)'],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: color || 'var(--text-primary)' }}>{val}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-6)', maxWidth: 600 }}>
              {movie.synopsis}
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-lg ${inWatchlist ? 'btn-outline' : 'btn-secondary'}`}
                onClick={toggleWatchlist}
              >
                <svg viewBox="0 0 24 24" fill={inWatchlist ? 'var(--accent-red)' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* ── Reviews section ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Reviews {!revLoading && `(${reviews.length})`}
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/add-review?movie_id=${id}`)}>
              + Write a Review
            </button>
          </div>

          {revLoading ? (
            <ReviewGridSkeleton count={3} />
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎬</div>
              <p style={{ marginBottom: 'var(--space-4)' }}>No reviews yet. Be the first to share your thoughts!</p>
              <button className="btn btn-primary" onClick={() => navigate(`/add-review?movie_id=${id}`)}>Write a Review</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
