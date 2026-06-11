// src/pages/Community.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reviewsAPI, discussionsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewCard from '../components/ReviewCard';
import { ReviewGridSkeleton } from '../components/Skeleton';
import Footer from '../components/Footer';
import DiscussionComments from '../components/DiscussionComments'; // ← NEW

// ── Discussion Card ──────────────────────────────────────────
function DiscussionCard({ d, rank }) {
  const [expanded, setExpanded]         = useState(false);
  const [showComments, setShowComments] = useState(false);
  // Initialise liked/likes from server-provided data (works after page refresh)
  const [liked, setLiked]   = useState(d.liked ?? false);
  const [likes, setLikes]   = useState(d.likes_count ?? 0);
  const [liking, setLiking] = useState(false); // prevent double-click race condition
  const { isLoggedIn, user } = useAuth();
  const isMuted = user?.is_muted === 1 || user?.is_muted === true;
  const { showToast }  = useToast();
  const navigate       = useNavigate();

  const handleLike = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (liking) return; // debounce concurrent clicks
    setLiking(true);

    // Optimistic UI update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(l => wasLiked ? Math.max(0, l - 1) : l + 1);

    try {
      const { data } = await discussionsAPI.like(d.id);
      // Reconcile with authoritative server values
      setLiked(data.liked);
      setLikes(data.likes_count);
    } catch {
      // Rollback optimistic update on failure
      setLiked(wasLiked);
      setLikes(l => wasLiked ? l + 1 : Math.max(0, l - 1));
      showToast('Could not update like', 'error');
    } finally {
      setLiking(false);
    }
  };

  const rankColors = {
    1: { bg: 'rgba(255,193,7,.15)',   color: '#ffc107' },
    2: { bg: 'rgba(176,190,197,.15)', color: '#b0bec5' },
    3: { bg: 'rgba(188,143,143,.15)', color: '#bc8f8f' },
  };
  const rankStyle = rankColors[rank] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };

  const tags = Array.isArray(d.tags) ? d.tags : JSON.parse(d.tags || '[]');

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', transition: 'border-color var(--transition-base)', marginBottom: 'var(--space-4)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {/* Rank badge */}
        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-full)', background: rankStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: rankStyle.color, flexShrink: 0 }}>
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 22, height: 22, borderRadius: 'var(--radius-full)', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={d.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${d.username}`}
                alt={d.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-green)' }}>@{d.username}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              · {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-3)', cursor: 'pointer', transition: 'color var(--transition-fast)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
            {d.title}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
              {tags.map(t => (
                <span key={t} className="badge" style={{ background: 'rgba(96,165,250,.1)', borderColor: 'rgba(96,165,250,.2)', color: 'var(--accent-blue)' }}>{t}</span>
              ))}
            </div>
          )}

          {/* Body preview */}
          {expanded && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
              {d.body}
            </p>
          )}

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {/* Like button */}
              <button onClick={handleLike} disabled={liking} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: liking ? 'default' : 'pointer', color: liked ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: 'var(--text-xs)', transition: 'color var(--transition-fast)' }}
                onMouseEnter={e => { if (!liking) e.currentTarget.style.color = 'var(--accent-red)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = liked ? 'var(--accent-red)' : 'var(--text-muted)'; }}>
                <svg viewBox="0 0 24 24" fill={liked ? 'var(--accent-red)' : 'none'} stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likes}
              </button>

              {/* ── NEW: Comments toggle button ── */}
              <button
                onClick={() => setShowComments(c => !c)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', transition: 'color var(--transition-fast)', color: showComments ? 'var(--accent-green)' : 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-green)'}
                onMouseLeave={e => e.currentTarget.style.color = showComments ? 'var(--accent-green)' : 'var(--text-muted)'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {d.replies ?? 0} {showComments ? '↑' : '↓'}
              </button>

              {/* Views */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {d.views >= 1000 ? `${(d.views / 1000).toFixed(1)}K` : d.views}
              </span>
            </div>
            <button onClick={() => setExpanded(e => !e)}
              style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.9 }}>
              {expanded ? 'Show less ↑' : 'Read more ↓'}
            </button>
          </div>

          {/* ── NEW: Inline comment section ── */}
          {showComments && (
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
              <DiscussionComments discussionId={d.id} isMuted={isMuted} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Discussion Form ──────────────────────────────────────
function NewDiscussionForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]   = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { isLoggedIn, user } = useAuth();
  const isMuted = user?.is_muted === 1 || user?.is_muted === true;
  const navigate = useNavigate();

  // Muted users see a notice instead of the form
  if (isLoggedIn && isMuted) {
    return (
      <div style={{ background: 'rgba(255,170,0,.08)', border: '1px solid rgba(255,170,0,.3)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: 'var(--text-sm)', color: '#ffaa00' }}>
          Your account has been muted. You cannot post discussions or comments, but you can still like posts.
        </span>
      </div>
    );
  }

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, '');
      if (!tags.includes(t) && tags.length < 5) setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const submit = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!title.trim() || !body.trim()) { showToast('Title and body are required', 'error'); return; }
    setLoading(true);
    try {
      await discussionsAPI.create({ title, body, tags });
      showToast('Discussion posted! 🎬');
      setTitle(''); setBody(''); setTags([]);
      onCreated();
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not post discussion', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Start a Discussion
      </h3>
      <input
        value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Discussion title…"
        style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none', marginBottom: 'var(--space-3)', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <textarea
        value={body} onChange={e => setBody(e.target.value)}
        placeholder="Share your thoughts…"
        rows={4}
        style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {/* Tag input */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: tags.length ? 'var(--space-2)' : 0 }}>
          {tags.map(t => (
            <span key={t} className="badge badge-mood" style={{ cursor: 'pointer' }} onClick={() => setTags(prev => prev.filter(x => x !== t))}>
              {t} ×
            </span>
          ))}
        </div>
        <input
          value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
          placeholder="Add tags (press Enter) — up to 5"
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
          {loading ? 'Posting…' : 'Post Discussion'}
        </button>
      </div>
    </div>
  );
}

// ── Community Page ───────────────────────────────────────────
const TABS = [
  { id: 'trending',    label: 'Trending Reviews',  icon: '📈' },
  { id: 'top',         label: 'Top Rated',          icon: '⭐' },
  { id: 'liked',       label: 'Most Liked',         icon: '❤️' },
  { id: 'discussions', label: 'Discussions',        icon: '💬' },
];

const STATS = [
  { label: 'Reviews',     value: '10K+' },
  { label: 'Movies',      value: '18+'  },
  { label: 'Members',     value: '5K+'  },
  { label: 'Discussions', value: '2K+'  },
];

export default function Community() {
  const [tab, setTab]                 = useState('trending');
  const [reviews, setReviews]         = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [discRefresh, setDiscRefresh] = useState(0);

  // Load reviews when review tabs change
  useEffect(() => {
    if (tab === 'discussions') return;
    setLoading(true);
    const sortMap = { trending: 'recent', top: 'rating', liked: 'likes' };
    reviewsAPI.getAll({ sort: sortMap[tab], limit: 8 })
      .then(r => setReviews(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  // Load discussions
  useEffect(() => {
    if (tab !== 'discussions') return;
    setLoading(true);
    discussionsAPI.getAll({ sort: 'likes', limit: 20 })
      .then(r => setDiscussions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, discRefresh]);

  const tabStyle = (id) => ({
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)', fontWeight: 500,
    color: tab === id ? 'var(--accent-green)' : 'var(--text-tertiary)',
    borderBottom: `2px solid ${tab === id ? 'var(--accent-green)' : 'transparent'}`,
    marginBottom: -1, cursor: 'pointer',
    background: 'none', border: 'none',
    whiteSpace: 'nowrap', transition: 'all var(--transition-base)',
  });

  return (
    <main className="page-content">
      <div className="container">

        {/* Page Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--accent-green-dim)', border: '1px solid rgba(0,224,84,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>Community</h1>
          </div>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginLeft: 'calc(48px + var(--space-4))' }}>
            Join the conversation. Share your thoughts with fellow cinephiles.
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }} className="comm-stats-grid">
          {STATS.map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center', transition: 'border-color var(--transition-base)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-green)', display: 'block' }}>{value}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 'var(--space-1)', display: 'block' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'discussions' ? (
          <>
            <NewDiscussionForm onCreated={() => setDiscRefresh(r => r + 1)} />
            {loading
              ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>Loading discussions…</div>
              : discussions.length === 0
                ? <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>No discussions yet. Start one above!</div>
                : discussions.map((d, i) => <DiscussionCard key={d.id} d={d} rank={i + 1} />)
            }
          </>
        ) : (
          loading
            ? <ReviewGridSkeleton count={6} />
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
                {reviews.map((r, i) => (
                  <ReviewCard key={r.id} review={r} rankBadge={tab === 'top' && i < 3 ? i + 1 : null} />
                ))}
              </div>
        )}

        <style>{`
          @media (max-width: 640px) { .comm-stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        `}</style>
      </div>
      <Footer />
    </main>
  );
}
