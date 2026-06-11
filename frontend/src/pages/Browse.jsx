// src/pages/Browse.jsx  — shared by /movies and /tv
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moviesAPI } from '../api/client';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';
import { MovieGridSkeleton } from '../components/Skeleton';

const GENRES_MOVIE = ['Sci-Fi','Drama','Comedy','Action','Thriller','Romance','Biography','History','Crime','Fantasy','Animation','Adventure','Mystery'];
const GENRES_TV    = ['Drama','Comedy','Action','Thriller','Mystery','Sci-Fi','History'];

export default function Browse({ mediaType = 'movie' }) {
  const isTV = mediaType === 'tv';
  const genres = isTV ? GENRES_TV : GENRES_MOVIE;

  const [movies, setMovies]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [count, setCount]           = useState(0);
  const [activeGenres, setGenres]   = useState([]);
  const [sort, setSort]             = useState('popular');
  const [yearFrom, setYearFrom]     = useState('2000');
  const [yearTo, setYearTo]         = useState('2025');
  const [quickQ, setQuickQ]         = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { type: mediaType, sort, yearFrom, yearTo, limit: 50 };
      if (activeGenres.length) params.genre = activeGenres[0]; // server filters one genre
      const { data } = await moviesAPI.getAll(params);
      // Client-side multi-genre + quick search
      let filtered = data;
      if (activeGenres.length > 1) filtered = filtered.filter(m => activeGenres.some(g => m.genre?.includes(g)));
      if (quickQ) filtered = filtered.filter(m => m.title.toLowerCase().includes(quickQ.toLowerCase()));
      setMovies(filtered);
      setCount(filtered.length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [mediaType, sort, yearFrom, yearTo, activeGenres, quickQ]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleGenre = (g) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const clearAll    = () => { setGenres([]); setSort('popular'); setYearFrom('2000'); setYearTo('2025'); setQuickQ(''); };

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating',  label: 'Highest Rated' },
    { value: 'latest',  label: 'Latest First' },
    { value: 'title',   label: 'A–Z' },
  ];

  return (
    <main className="page-content">
      <div className="container">
        {/* Page header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-green-dim)', border: '1px solid rgba(0,224,84,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              {isTV
                ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2l-5 5-5-5"/></svg>
                : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>{isTV ? 'TV Shows' : 'Movies'}</h1>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginLeft: 'calc(48px + var(--space-4))' }}>
            Browse and filter {isTV ? 'TV shows' : 'films'} by genre, year and more.
          </p>
        </div>

        <div className="browse-layout">
          {/* Sidebar */}
          <aside className="filter-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
              <svg style={{ color: 'var(--accent-green)', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
            </div>

            {/* Quick search */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div className="filter-section-title">Search Title</div>
              <input className="form-input" placeholder="Search..." value={quickQ} onChange={e => setQuickQ(e.target.value)} />
            </div>

            {/* Genre chips */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div className="filter-section-title">Genre</div>
              <div className="chips">
                {genres.map(g => (
                  <button key={g} className={`chip ${activeGenres.includes(g) ? 'active' : ''}`} onClick={() => toggleGenre(g)}>{g}</button>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div className="filter-section-title">Year Range</div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input className="form-input" type="number" placeholder="From" value={yearFrom} onChange={e => setYearFrom(e.target.value)} style={{ textAlign: 'center' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', flexShrink: 0 }}>to</span>
                <input className="form-input" type="number" placeholder="To"   value={yearTo}   onChange={e => setYearTo(e.target.value)}   style={{ textAlign: 'center' }} />
              </div>
            </div>

            {/* Sort */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div className="filter-section-title">Sort By</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {sortOptions.map(o => (
                  <button key={o.value} onClick={() => setSort(o.value)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: `1px solid ${sort === o.value ? 'var(--accent-green)' : 'var(--border)'}`, background: sort === o.value ? 'var(--accent-green-dim)' : 'transparent', color: sort === o.value ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all var(--transition-base)' }}>
                    {o.label}
                    {sort === o.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ))}
              </div>
            </div>

            {(activeGenres.length > 0 || quickQ) && (
              <button className="btn btn-outline btn-full" onClick={clearAll}>Clear Filters</button>
            )}
          </aside>

          {/* Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                {loading ? 'Loading…' : `${count} ${isTV ? 'shows' : 'movies'} found`}
              </span>
            </div>
            {loading
              ? <MovieGridSkeleton count={8} />
              : movies.length === 0
                ? <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-tertiary)' }}>No results found. Try adjusting your filters.</div>
                : <div className="movies-grid">{movies.map(m => <MovieCard key={m.id} movie={m} />)}</div>}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
