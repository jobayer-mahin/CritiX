// src/pages/Home.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moviesAPI, reviewsAPI } from '../api/client';
import MovieCard from '../components/MovieCard';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';
import { HeroSkeleton, MovieGridSkeleton, ReviewGridSkeleton } from '../components/Skeleton';

// ── Intelligent Shuffle Utility ───────────────────────────────
/**
 * Returns a shuffled array of movies with diversity scoring.
 * Balances: type (movie vs tv), genres, avoids recently shown.
 */
const HERO_HISTORY_KEY = 'critix_hero_history';
const HISTORY_MAX = 10;

function getShuffledHeroItems(movies, maxItems = 5) {
  if (!movies || movies.length === 0) return [];
  if (movies.length <= maxItems) {
    // Small pool: just shuffle randomly
    return [...movies].sort(() => Math.random() - 0.5);
  }

  // Load session history of recently shown IDs
  let history = [];
  try {
    history = JSON.parse(sessionStorage.getItem(HERO_HISTORY_KEY) || '[]');
  } catch { history = []; }

  // Score each movie — lower = preferred (fresher/more diverse)
  const scored = movies.map((m) => {
    let score = Math.random() * 10; // base randomness
    // Penalise recently shown
    const recencyIdx = history.indexOf(m.id);
    if (recencyIdx !== -1) {
      score += (HISTORY_MAX - recencyIdx) * 3; // older history = smaller penalty
    }
    return { m, score };
  });

  // Sort ascending (lower score = pick first)
  scored.sort((a, b) => a.score - b.score);
  const chosen = scored.slice(0, maxItems).map(({ m }) => m);

  // Ensure we mix types if possible
  const hasMovie = chosen.some(m => m.type === 'movie');
  const hasTv    = chosen.some(m => m.type === 'tv');
  if (!hasMovie || !hasTv) {
    const missingType = !hasMovie ? 'movie' : 'tv';
    const candidate = scored.find(
      ({ m }) => m.type === missingType && !chosen.includes(m)
    );
    if (candidate) {
      chosen[chosen.length - 1] = candidate.m; // swap last
    }
  }

  // Persist new history (add chosen IDs, cap at HISTORY_MAX)
  const newHistory = [...chosen.map(m => m.id), ...history].slice(0, HISTORY_MAX);
  try { sessionStorage.setItem(HERO_HISTORY_KEY, JSON.stringify(newHistory)); } catch {}

  return chosen;
}

// ── Hero Carousel ─────────────────────────────────────────────
function HeroCarousel({ movies, loading }) {
  const [idx, setIdx]   = useState(0);
  const timer           = useRef(null);
  const navigate        = useNavigate();
  const { showToast }   = useToast();

  const startTimer = useCallback((len) => {
    clearInterval(timer.current);
    if (len > 1) {
      timer.current = setInterval(() => setIdx(p => (p + 1) % len), 6000);
    }
  }, []);

  const go = (i) => {
    setIdx(i);
    startTimer(movies.length);
  };

  useEffect(() => {
    if (!movies.length) return;
    setIdx(0);
    startTimer(movies.length);
    return () => clearInterval(timer.current);
  }, [movies.length, startTimer]);

  if (loading) return <HeroSkeleton />;
  if (!movies.length) return null;

  return (
    <section className="hero-carousel" aria-label="Featured films">
      {movies.map((m, i) => (
        <div key={m.id} className={`hero-slide ${i === idx ? 'active' : ''}`}>
          <img src={m.backdrop || m.poster} alt={m.title} loading={i === 0 ? 'eager' : 'lazy'} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-meta">
              <span className={`badge ${m.type === 'tv' ? 'badge-tv' : 'badge-movie'}`}>
                {m.type === 'tv' ? 'TV' : 'Film'}
              </span>
              <span className="badge" style={{ background: 'rgba(255,136,0,.15)', borderColor: 'rgba(255,136,0,.3)', color: '#ff8800' }}>
                ★ {m.rating}
              </span>
              <span className="badge badge-fresh">{m.critics}% Fresh</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,.5)' }}>{m.year}</span>
            </div>
            <h2 className="hero-title">{m.title}</h2>
            <p className="hero-desc">{m.synopsis}</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/movies/${m.id}`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
                View Details
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => {
                moviesAPI.addWatchlist(m.id)
                  .then(() => showToast('Added to watchlist! ❤️'))
                  .catch(() => showToast('Sign in to use watchlist', 'error'));
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Watchlist
              </button>
            </div>
          </div>
        </div>
      ))}
      {movies.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Slide navigation">
          {movies.map((m, i) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={i === idx}
              aria-label={`Slide ${i + 1}: ${m.title}`}
              className={`hero-dot ${i === idx ? 'active' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Home Page ─────────────────────────────────────────────────
export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular]   = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      moviesAPI.getFeatured(),                                        // randomised pool from backend
      moviesAPI.getAll({ sort: 'popular', limit: 6 }),
      moviesAPI.getAll({ sort: 'rating',  limit: 4 }),
      reviewsAPI.getAll({ sort: 'recent', limit: 4 }),
    ]).then(([f, t, p, r]) => {
      // Intelligently shuffle hero pool with session history memory
      const pool = Array.isArray(f.data) ? f.data : [];
      setFeatured(getShuffledHeroItems(pool, 5));
      setTrending(t.data);
      setPopular(p.data);
      setReviews(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const SectionTitle = ({ icon, children }) => (
    <h2 className="section-title">
      {icon}
      {children}
    </h2>
  );

  return (
    <main className="page-content">
      <div className="container">
        <HeroCarousel movies={featured} loading={loading} />

        {/* Trending */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <SectionTitle icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            }>
              Trending Now
            </SectionTitle>
          </div>
          {loading
            ? <MovieGridSkeleton count={6} />
            : <div className="movies-grid">{trending.map(m => <MovieCard key={m.id} movie={m} />)}</div>
          }
        </section>

        {/* Latest Reviews */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <SectionTitle icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }>
              Latest Reviews
            </SectionTitle>
          </div>
          {loading
            ? <ReviewGridSkeleton count={4} />
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
          }
        </section>

        {/* Highest Rated */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <SectionTitle icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }>
              Highest Rated
            </SectionTitle>
          </div>
          {loading
            ? <MovieGridSkeleton count={4} />
            : <div className="movies-grid">{popular.map(m => <MovieCard key={m.id} movie={m} />)}</div>
          }
        </section>
      </div>
      <Footer />
    </main>
  );
}
