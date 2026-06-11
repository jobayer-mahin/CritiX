// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(6rem, 20vw, 12rem)', fontWeight: 700, color: 'var(--bg-elevated)', lineHeight: 1, marginBottom: 'var(--space-4)', userSelect: 'none' }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          Scene Not Found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-base)', maxWidth: 380, margin: '0 auto var(--space-8)' }}>
          Looks like this reel went missing from the archive. The page you're looking for doesn't exist.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Go Home
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
