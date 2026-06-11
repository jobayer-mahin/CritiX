// src/pages/UserProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api/client';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';

export default function UserProfile() {
  const { id } = useParams();
  const { user: me, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile]     = useState(null);
  const [reviews, setReviews]     = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab]             = useState('reviews');
  const [loading, setLoading]     = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = me && String(me.id) === String(id);

  useEffect(() => {
    // Redirect to own profile page if viewing own id
    if (isOwnProfile) { navigate('/profile', { replace: true }); return; }

    Promise.all([
      authAPI.getUser(id),
      authAPI.getUserReviews(id),
      authAPI.getUserFollowers(id),
      authAPI.getUserFollowing(id),
    ]).then(([p, r, fo, fi]) => {
      setProfile(p.data);
      setReviews(r.data);
      setFollowers(fo.data);
      setFollowing(fi.data);
      if (me) setIsFollowing(fo.data.some(u => u.id === me.id));
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, me?.id]);

  const handleFollow = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await authAPI.unfollowUser(id);
        setIsFollowing(false);
        setFollowers(prev => prev.filter(u => u.id !== me.id));
        showToast('Unfollowed');
      } else {
        await authAPI.followUser(id);
        setIsFollowing(true);
        setFollowers(prev => [...prev, { id: me.id, username: me.username, display_name: me.display_name, avatar_url: me.avatar_url }]);
        showToast('Following! 🎉');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Something went wrong', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <main className="page-content">
      <div className="container" style={{ textAlign:'center', padding:'var(--space-16)', color:'var(--text-muted)' }}>Loading profile…</div>
    </main>
  );

  if (!profile) return null;

  const displayName = profile.display_name || profile.username;

  const TABS = [
    { id: 'reviews',   label: `Reviews (${reviews.length})` },
    { id: 'followers', label: `Followers (${followers.length})` },
    { id: 'following', label: `Following (${following.length})` },
  ];

  return (
    <main className="page-content">
      <div className="container">
        {/* Profile Header */}
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', padding:'var(--space-8)', marginBottom:'var(--space-8)', display:'flex', gap:'var(--space-6)', alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ width:88, height:88, borderRadius:'50%', overflow:'hidden', border:'3px solid var(--accent-green)', flexShrink:0 }}>
            <img src={profile.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=88&h=88&fit=crop&crop=face`} alt={profile.username} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-1)', flexWrap:'wrap' }}>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:'var(--text-2xl)', fontWeight:700 }}>{displayName}</h1>
              <span className="badge badge-fresh">Member</span>
            </div>
            <p style={{ fontSize:'var(--text-sm)', color:'var(--text-tertiary)', marginBottom:'var(--space-3)' }}>@{profile.username}</p>
            <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', marginBottom:'var(--space-4)' }}>
              {profile.bio || 'Film enthusiast. Subtle thoughts on cinema.'}
            </p>
            <div style={{ display:'flex', gap:'var(--space-6)', flexWrap:'wrap' }}>
              {[['Reviews', reviews.length], ['Followers', followers.length], ['Following', following.length], ['Joined', new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month:'short', year:'numeric' })]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</div>
                  <div style={{ fontSize:'var(--text-lg)', fontWeight:700, color:'var(--accent-green)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          {isLoggedIn && (
            <button className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleFollow} disabled={followLoading}>
              {followLoading ? '…' : isFollowing ? 'Unfollow' : '+ Follow'}
            </button>
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

        {tab === 'reviews'
          ? reviews.length === 0
            ? <EmptyState msg={`${displayName} hasn't written any reviews yet.`} />
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'var(--space-4)' }}>
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
          : tab === 'followers'
            ? <UserList users={followers} emptyMsg="No followers yet." />
            : <UserList users={following} emptyMsg={`${displayName} isn't following anyone yet.`} />
        }
      </div>
      <Footer />
    </main>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign:'center', padding:'var(--space-12)', color:'var(--text-tertiary)', background:'var(--bg-secondary)', borderRadius:'var(--radius-xl)', border:'1px solid var(--border)' }}>{msg}</div>
  );
}

function UserList({ users, emptyMsg }) {
  if (!users.length) return <EmptyState msg={emptyMsg} />;
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
