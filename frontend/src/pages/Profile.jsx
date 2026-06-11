// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reviewsAPI, moviesAPI, authAPI } from '../api/client';
import ReviewCard from '../components/ReviewCard';
import MovieCard from '../components/MovieCard';
import Footer from '../components/Footer';

export default function Profile() {
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab]           = useState('reviews');
  const [reviews, setReviews]   = useState([]);
  const [watchlist, setWL]      = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({ username: '', display_name: '', bio: '', avatar_url: '' });

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setForm({
      username:     user?.username || '',
      display_name: user?.display_name || '',
      bio:          user?.bio || '',
      avatar_url:   user?.avatar_url || '',
    });
    Promise.all([
      reviewsAPI.getAll({ user_id: user?.id, limit: 20 }),
      moviesAPI.getWatchlist(),
      authAPI.getUserFollowers(user?.id),
      authAPI.getUserFollowing(user?.id),
    ]).then(([r, w, fo, fi]) => {
      setReviews(r.data);
      setWL(w.data);
      setFollowers(fo.data);
      setFollowing(fi.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoggedIn, user?.id]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.update({
        username:     form.username,
        display_name: form.display_name,
        bio:          form.bio,
        avatar_url:   form.avatar_url,
      });
      // Update auth context user if possible
      if (res.data?.user && updateUser) updateUser(res.data.user);
      showToast('Profile updated! ✅');
      setEditing(false);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'reviews',   label: `Reviews (${reviews.length})` },
    { id: 'watchlist', label: `Watchlist (${watchlist.length})` },
    { id: 'followers', label: `Followers (${followers.length})` },
    { id: 'following', label: `Following (${following.length})` },
  ];

  const displayName = user.display_name || user.username;

  return (
    <main className="page-content">
      <div className="container">
        {/* Profile header */}
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'var(--space-8)', marginBottom:'var(--space-8)' }}>
          {editing ? (
            /* ── Edit Mode ── */
            <div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-xl)', marginBottom:'var(--space-6)' }}>Edit Profile</h2>
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'var(--space-8)', alignItems:'start' }}>
                {/* Avatar */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-3)' }}>
                  <div style={{ width:96, height:96, borderRadius:'50%', overflow:'hidden', border:'3px solid var(--accent-green)' }}>
                    <img src={form.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face`} alt="Avatar"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                  <input type="text" placeholder="Avatar URL" value={form.avatar_url}
                    onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                    style={{ width:180, padding:'var(--space-2) var(--space-3)', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'var(--text-xs)' }} />
                </div>

                {/* Fields */}
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                  <div>
                    <label style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>Display Name</label>
                    <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Your display name"
                      style={{ width:'100%', padding:'var(--space-3)', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'var(--text-sm)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>Username</label>
                    <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username"
                      style={{ width:'100%', padding:'var(--space-3)', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'var(--text-sm)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:6 }}>Bio</label>
                    <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell people about yourself..." rows={3}
                      style={{ width:'100%', padding:'var(--space-3)', background:'var(--bg-tertiary)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:'var(--text-sm)', resize:'vertical', fontFamily:'inherit' }} />
                  </div>
                  <div style={{ display:'flex', gap:'var(--space-3)' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                    <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── View Mode ── */
            <div style={{ display:'flex', gap:'var(--space-6)', alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ width:88, height:88, borderRadius:'var(--radius-full)', overflow:'hidden', border:'3px solid var(--accent-green)', flexShrink:0 }}>
                <img src={user.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=88&h=88&fit=crop&crop=face`} alt={user.username} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-1)', flexWrap:'wrap' }}>
                  <h1 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-2xl)', fontWeight:700 }}>{displayName}</h1>
                  <span className="badge badge-fresh">Member</span>
                </div>
                <p style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', marginBottom:'var(--space-1)' }}>@{user.username}</p>
                <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>
                  {user.bio || 'Film enthusiast. Subtle thoughts on cinema.'}
                </p>
                <div style={{ display:'flex', gap:'var(--space-6)', flexWrap:'wrap' }}>
                  {[['Reviews', reviews.length], ['Watchlist', watchlist.length], ['Followers', followers.length], ['Following', following.length], ['Joined', new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month:'short', year:'numeric' })]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</div>
                      <div style={{ fontSize:'var(--text-lg)', fontWeight:700, color:'var(--accent-green)' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:'var(--space-2)', flexWrap:'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Profile
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/'); showToast('Signed out'); }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'var(--space-2)', borderBottom:'1px solid var(--border)', marginBottom:'var(--space-6)', overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'var(--space-3) var(--space-4)', fontSize:'var(--text-sm)', fontWeight:500, color: tab === t.id ? 'var(--accent-green)' : 'var(--text-tertiary)', borderBottom:`2px solid ${tab === t.id ? 'var(--accent-green)' : 'transparent'}`, marginBottom:-1, cursor:'pointer', background:'none', border:'none', borderBottom:`2px solid ${tab === t.id ? 'var(--accent-green)' : 'transparent'}`, whiteSpace:'nowrap', transition:'all var(--transition-base)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading
          ? <div style={{ textAlign:'center', padding:'var(--space-16)', color:'var(--text-muted)' }}>Loading…</div>
          : tab === 'reviews'
            ? reviews.length === 0
              ? <EmptyState msg="You haven't written any reviews yet." cta="Write Your First Review" onClick={() => navigate('/add-review')} />
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'var(--space-4)' }}>
                  {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
            : tab === 'watchlist'
              ? watchlist.length === 0
                ? <EmptyState msg="Your watchlist is empty." cta="Browse Movies" onClick={() => navigate('/movies')} />
                : <div className="movies-grid">{watchlist.map(m => <MovieCard key={m.id} movie={m} />)}</div>
              : tab === 'followers'
                ? <UserList users={followers} emptyMsg="No followers yet." />
                : <UserList users={following} emptyMsg="You're not following anyone yet." />
        }
      </div>
      <Footer />
    </main>
  );
}

function EmptyState({ msg, cta, onClick }) {
  return (
    <div style={{ textAlign:'center', padding:'var(--space-12)', color:'var(--text-tertiary)', background:'var(--bg-secondary)', borderRadius:'var(--radius-xl)', border:'1px solid var(--border)' }}>
      <p style={{ marginBottom:'var(--space-4)' }}>{msg}</p>
      <button className="btn btn-primary" onClick={onClick}>{cta}</button>
    </div>
  );
}

function UserList({ users, emptyMsg }) {
  if (!users.length) return (
    <div style={{ textAlign:'center', padding:'var(--space-12)', color:'var(--text-tertiary)', background:'var(--bg-secondary)', borderRadius:'var(--radius-xl)', border:'1px solid var(--border)' }}>{emptyMsg}</div>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'var(--space-4)' }}>
      {users.map(u => (
        <Link key={u.id} to={`/users/${u.id}`} style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'var(--space-4)', textDecoration:'none', transition:'border-color var(--transition-base)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent-green)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <img src={u.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face`} alt={u.username}
            style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          <div>
            <div style={{ fontWeight:600, fontSize:'var(--text-sm)', color:'var(--text-primary)' }}>{u.display_name || u.username}</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>@{u.username}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
