// src/pages/AddReview.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { moviesAPI, reviewsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const MOODS = ['⚡ Epic','🌀 Mind-bending','🥰 Heartwarming','😱 Terrifying','😂 Hilarious','✨ Inspiring','😴 Boring','🧠 Thought-provoking'];

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="36" height="36" viewBox="0 0 24 24"
            fill={(hover || value) >= n ? 'var(--accent-orange)' : 'var(--text-muted)'}
            style={{ color: (hover || value) >= n ? 'var(--accent-orange)' : 'var(--text-muted)', opacity: hover > 0 && hover < n ? .5 : 1, transition: 'all var(--transition-fast)' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
      {value > 0 && <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-orange)', marginLeft: 'var(--space-2)' }}>{value}/5</span>}
    </div>
  );
}

export default function AddReview() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isLoggedIn } = useAuth();

  const [allMovies, setAllMovies]     = useState([]);
  const [movieQuery, setMovieQuery]   = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedMovie, setSelected]  = useState(null);
  const [rating, setRating]           = useState(0);
  const [text, setText]               = useState('');
  const [mood, setMood]               = useState('');
  const [quote, setQuote]             = useState('');
  const [rewatch, setRewatch]         = useState(5);
  const [isSpoiler, setSpoiler]       = useState(false);
  const [visibility] = useState('public');
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    moviesAPI.getAll({ limit: 100 }).then(r => {
      setAllMovies(r.data);
      // Auto-select if movie_id is in URL
      const preId = searchParams.get('movie_id');
      if (preId) {
        const found = r.data.find(m => String(m.id) === String(preId));
        if (found) { setSelected(found); setMovieQuery(found.title); }
      }
    }).catch(() => {});
  }, [isLoggedIn, searchParams]);

  const handleMovieSearch = (q) => {
    setMovieQuery(q);
    setSelected(null);
    if (!q) { setSuggestions([]); return; }
    setSuggestions(allMovies.filter(m => m.title.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
  };

  const validate = () => {
    const e = {};
    if (!selectedMovie) e.movie = 'Please select a movie or show.';
    if (!rating)        e.rating = 'Please select a rating.';
    if (text.length < 50) e.text = 'Review must be at least 50 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await reviewsAPI.create({
        movie_id: selectedMovie.id,
        rating, text, mood: mood.replace(/^[^\w]+/, '').trim() || null,
        quote: quote || null, is_spoiler: isSpoiler, visibility, rewatch,
      });
      setSuccess(true);
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not publish review', 'error');
    } finally { setSubmitting(false); }
  };

  const inputStyle = (hasErr) => ({ width: '100%', background: 'rgba(255,255,255,.05)', border: `1px solid ${hasErr ? 'var(--accent-red)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none', transition: 'all var(--transition-base)' });

  if (success) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0,224,84,.3)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-12) var(--space-8)', textAlign: 'center', maxWidth: 400, width: '90%', animation: 'fadeIn .3s ease' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🎬</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--accent-green)' }}>Review Published!</div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Your review has been shared with the Critix community.</p>
        <button className="btn btn-primary" onClick={() => navigate('/community')}>View in Community →</button>
      </div>
    </div>
  );

  return (
    <main className="page-content">
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 var(--space-4)' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-green-dim)', border: '1px solid rgba(0,224,84,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>Write a Review</h1>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginLeft: 'calc(48px + var(--space-4))' }}>Share your subtle thoughts with the community</p>
        </div>

        {/* Form card */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)' }}>

          {/* Movie selector */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Select Movie / Show <span style={{ color: 'var(--accent-green)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={selectedMovie ? selectedMovie.title : movieQuery} onChange={e => handleMovieSearch(e.target.value)} placeholder="Search for a movie or show…" style={{ ...inputStyle(errors.movie), paddingLeft: 44 }} />
              {suggestions.length > 0 && !selectedMovie && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', borderRadius: 'var(--radius-lg)', zIndex: 50, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
                  {suggestions.map(m => (
                    <div key={m.id} onClick={() => { setSelected(m); setMovieQuery(m.title); setSuggestions([]); setErrors(e => ({ ...e, movie: null })); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <img src={m.poster} alt={m.title} style={{ width: 36, height: 52, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{m.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{m.year}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.movie && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', marginTop: 'var(--space-1)' }}>{errors.movie}</p>}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: 'var(--space-6) 0' }} />

          {/* Rating */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              Your Rating <span style={{ color: 'var(--accent-green)' }}>*</span>
            </label>
            <StarPicker value={rating} onChange={v => { setRating(v); setErrors(e => ({ ...e, rating: null })); }} />
            {errors.rating && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', marginTop: 'var(--space-1)' }}>{errors.rating}</p>}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: 'var(--space-6) 0' }} />

          {/* Review text */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Your Review <span style={{ color: 'var(--accent-green)' }}>*</span>
            </label>
            <textarea value={text} onChange={e => { setText(e.target.value); if (e.target.value.length >= 50) setErrors(er => ({ ...er, text: null })); }}
              placeholder="What did you think? Share your thoughts… (minimum 50 characters)"
              rows={5} style={{ ...inputStyle(errors.text), resize: 'vertical', lineHeight: 'var(--leading-relaxed)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-1)' }}>
              {errors.text ? <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)' }}>{errors.text}</p> : <span />}
              <span style={{ fontSize: 'var(--text-xs)', color: text.length >= 50 ? 'var(--accent-green)' : 'var(--text-muted)' }}>{text.length} / 50 minimum</span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: 'var(--space-6) 0' }} />

          {/* Mood */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              How Did It Make You Feel? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setMood(prev => prev === m ? '' : m)}
                  style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)', background: mood === m ? 'rgba(0,224,84,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${mood === m ? 'rgba(0,224,84,.4)' : 'var(--border)'}`, color: mood === m ? 'var(--accent-green)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Rewatchability */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Rewatchability <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{rewatch}</span>
            </label>
            <input type="range" min="1" max="10" value={rewatch} onChange={e => setRewatch(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-green)', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <span>Never again</span><span>Occasionally</span><span>All the time</span>
            </div>
          </div>

          {/* Quote */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              Memorable Quote <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input value={quote} onChange={e => setQuote(e.target.value)} placeholder="Any line that stuck with you?" style={inputStyle(false)} />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: 'var(--space-6) 0' }} />

          {/* Spoiler checkbox */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isSpoiler} onChange={e => setSpoiler(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-green)', cursor: 'pointer' }} />
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>This review contains spoilers</strong>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your review will be hidden behind a blur until revealed.</div>
              </div>
            </label>
          </div>

          {/* Visibility — Public only */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Visibility</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)', border: '1px solid rgba(0,224,84,.5)', borderRadius: 'var(--radius-lg)', background: 'rgba(0,224,84,.08)' }}>
              <span style={{ fontSize: '1.25rem' }}>🌐</span>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-green)' }}>Public</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>Visible to everyone in the Critix community</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              {submitting ? 'Publishing…' : 'Publish Review'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
