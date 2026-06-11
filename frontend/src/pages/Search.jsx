// src/pages/Search.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moviesAPI } from '../api/client';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const { data } = await moviesAPI.getAll({ q, limit: 50 });
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (q) doSearch(q);
  }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter') { setSearchParams({ q: query }); doSearch(query); }
  };

  return (
    <main className="page-content">
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Search</h1>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-8)' }}>
          <svg style={{ position: 'absolute', left: 'var(--space-5)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 20, height: 20, pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search movies, shows… press Enter"
            autoFocus
            style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4) var(--space-4) var(--space-4) 52px', fontSize: 'var(--text-lg)', color: 'var(--text-primary)', outline: 'none', transition: 'all var(--transition-base)' }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-muted)' }}>Searching…</div>}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔍</div>
            <p>No results for <strong>"{query}"</strong></p>
            <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>Try a different title or check your spelling.</p>
          </div>
        )}
        {!loading && results.length > 0 && (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-5)' }}>{results.length} results for "{query}"</p>
            <div className="movies-grid">{results.map(m => <MovieCard key={m.id} movie={m} />)}</div>
          </>
        )}
        {!searched && (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎬</div>
            <p>Start typing to search movies and TV shows</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
