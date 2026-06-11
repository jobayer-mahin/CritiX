// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavHint } from '../context/NavHintContext';
import { moviesAPI, authAPI } from '../api/client';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const { hint } = useNavHint();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [searchVal, setSearchVal]       = useState('')
  const [inlineRes, setInlineRes]       = useState([]);
  const [showInline, setShowInline]     = useState(false);
  const [allMovies, setAllMovies]       = useState([]);
  const [notifs, setNotifs]             = useState([]);
  const [showNotifs, setShowNotifs]     = useState(false);
  const searchRef  = useRef(null);
  const notifRef   = useRef(null);

  // Pre-load movies for inline search
  useEffect(() => {
    moviesAPI.getAll({ limit: 100 }).then(r => setAllMovies(r.data)).catch(() => {});
  }, []);

  // Load notifications
  useEffect(() => {
    if (!isLoggedIn) return;
    authAPI.getNotifications().then(r => setNotifs(r.data)).catch(() => {});
  }, [isLoggedIn]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const handleNotifOpen = () => {
    setShowNotifs(v => {
      if (!v && unreadCount > 0) {
        authAPI.markNotificationsRead().then(() =>
          setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })))
        ).catch(() => {});
      }
      return !v;
    });
  };

  const handleSearch = (val) => {
    setSearchVal(val);
    if (!val.trim()) { setShowInline(false); return; }
    const matches = allMovies.filter(m => m.title.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
    setInlineRes(matches);
    setShowInline(matches.length > 0);
  };

  const goToMovie = (id) => {
    setShowInline(false);
    setSearchVal('');
    navigate(`/movies/${id}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      setShowInline(false);
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
    if (e.key === 'Escape') setShowInline(false);
  };

  // Close inline on outside click
  useEffect(() => {
    const fn = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowInline(false);
      if (!notifRef.current?.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const isActive = (path) => {
    // If a page has explicitly told us which section is active (e.g. a TV show
    // detail page sets hint='/tv'), use that instead of URL matching.
    if (hint) return hint === path;
    // Default: exact match OR starts-with for section roots
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { to: '/movies',    label: 'Movies',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg> },
    { to: '/tv',        label: 'TV Shows',  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2l-5 5-5-5"/></svg> },
    { to: '/community', label: 'Community', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  ];

  return (
    <>
      <nav style={{ position:'fixed', top:0, left:0, right:0, height:'var(--nav-height)', background:'rgba(13,13,13,.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)', zIndex:100, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', maxWidth:'var(--max-width)', margin:'0 auto', padding:'0 var(--space-6)', gap:'var(--space-4)' }}>
          {/* Brand + links */}
          <div style={{ display:'flex', alignItems:'center' }}>
            <Link to="/" style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexShrink:0, cursor:'pointer', textDecoration:'none' }}>
              <div style={{ width:36, height:36, borderRadius:'var(--radius-full)', overflow:'hidden', flexShrink:0 }}>
                <img src="/logo.png" alt="Critix" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='var(--accent-green)'; e.target.parentElement.innerHTML='<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:var(--font-display);font-size:14px;font-weight:700;color:#000">C</span>'; }} />
              </div>
              <span style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, letterSpacing:'-.02em' }}>Critix</span>
            </Link>

            {/* Desktop nav links */}
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-1)', marginLeft:'var(--space-4)' }} className="desktop-nav-links">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', padding:'var(--space-2) var(--space-3)', borderRadius:'var(--radius-md)', fontSize:'var(--text-sm)', fontWeight:500, color: isActive(l.to) ? 'var(--accent-green)' : 'var(--text-secondary)', background: isActive(l.to) ? 'var(--accent-green-dim)' : 'transparent', cursor:'pointer', transition:'all var(--transition-base)', textDecoration:'none', whiteSpace:'nowrap' }}>
                  {l.icon}{l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search */}
          <div ref={searchRef} style={{ flex:1, maxWidth:420, position:'relative' }} className="desktop-search">
            <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none', width:15, height:15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={handleSearchSubmit}
              type="search" placeholder="Search movies, shows..."
              style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:'var(--radius-full)', padding:'var(--space-2) var(--space-4) var(--space-2) 40px', fontSize:'var(--text-sm)', color:'var(--text-primary)', outline:'none', transition:'all var(--transition-base)' }}
            />
            {showInline && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'var(--bg-elevated)', border:'1px solid var(--border-hover)', borderRadius:'var(--radius-lg)', zIndex:200, overflow:'hidden', boxShadow:'var(--shadow-xl)', maxHeight:360, overflowY:'auto' }}>
                {inlineRes.map(m => (
                  <div key={m.id} onClick={() => goToMovie(m.id)} style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', cursor:'pointer', transition:'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <img src={m.poster} alt={m.title} style={{ width:32, height:46, borderRadius:'var(--radius-sm)', objectFit:'cover', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'var(--text-sm)', fontWeight:500 }}>{m.title}</div>
                      <div style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>{m.year} · {m.type === 'tv' ? 'TV Show' : 'Movie'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side */}
          <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', flexShrink:0 }}>
            {isLoggedIn ? (
              <>
                <Link to="/add-review" className="btn btn-primary btn-sm" style={{ display:'inline-flex' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Review
                </Link>

                {/* Notification Bell */}
                <div ref={notifRef} style={{ position:'relative' }}>
                  <button onClick={handleNotifOpen} style={{ position:'relative', background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', padding:'6px', borderRadius:'var(--radius-full)', transition:'color var(--transition-base)', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-secondary)'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    {unreadCount > 0 && (
                      <span style={{ position:'absolute', top:2, right:2, width:8, height:8, background:'var(--accent-red, #e53e3e)', borderRadius:'50%', border:'1.5px solid var(--bg-primary)' }} />
                    )}
                  </button>

                  {showNotifs && (
                    <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:320, background:'var(--bg-elevated)', border:'1px solid var(--border-hover)', borderRadius:'var(--radius-lg)', zIndex:200, boxShadow:'var(--shadow-xl)', overflow:'hidden' }}>
                      <div style={{ padding:'var(--space-4)', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'var(--text-sm)' }}>Notifications</div>
                      <div style={{ maxHeight:360, overflowY:'auto' }}>
                        {notifs.length === 0 ? (
                          <div style={{ padding:'var(--space-8)', textAlign:'center', color:'var(--text-muted)', fontSize:'var(--text-sm)' }}>No notifications yet</div>
                        ) : notifs.map(n => (
                          <div key={n.id} style={{ display:'flex', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', borderBottom:'1px solid var(--border)', background: n.is_read ? 'transparent' : 'rgba(74,222,128,.04)' }}>
                            <img src={n.from_avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face`} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                            <div>
                              <div style={{ fontSize:'var(--text-sm)', color:'var(--text-primary)', lineHeight:1.4 }}>{n.message}</div>
                              <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:2 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" style={{ width:34, height:34, borderRadius:'var(--radius-full)', border:'2px solid var(--border)', overflow:'hidden', cursor:'pointer', transition:'border-color var(--transition-base)', display:'block' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent-green)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <img src={user?.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=68&h=68&fit=crop&crop=face`} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </Link>
              </>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(o => !o)} className="hamburger-btn" style={{ display:'none', flexDirection:'column', gap:5, padding:'var(--space-2)', borderRadius:'var(--radius-sm)', background:'none', border:'none', cursor:'pointer' }}>
              <span style={{ display:'block', width:22, height:2, background:'var(--text-secondary)', borderRadius:2, transition:'all var(--transition-base)', transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }}/>
              <span style={{ display:'block', width:22, height:2, background:'var(--text-secondary)', borderRadius:2, transition:'all var(--transition-base)', opacity: mobileOpen ? 0 : 1 }}/>
              <span style={{ display:'block', width:22, height:2, background:'var(--text-secondary)', borderRadius:2, transition:'all var(--transition-base)', transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }}/>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ display:'flex', position:'fixed', top:'var(--nav-height)', left:0, right:0, background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', zIndex:99, padding:'var(--space-4)', flexDirection:'column', gap:'var(--space-2)', animation:'slideDown .25s ease' }}>
          {[{ to:'/', label:'🏠 Home' }, ...navLinks.map(l => ({ to:l.to, label:l.label })), { to:'/search', label:'🔍 Search' }].map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', borderRadius:'var(--radius-md)', fontSize:'var(--text-base)', color: isActive(l.to) ? 'var(--accent-green)' : 'var(--text-secondary)', background: isActive(l.to) ? 'var(--accent-green-dim)' : 'transparent', textDecoration:'none' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ height:1, background:'var(--border)', margin:'var(--space-2) 0' }}/>
          {isLoggedIn ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', borderRadius:'var(--radius-md)', fontSize:'var(--text-base)', color:'var(--text-secondary)', textDecoration:'none' }}>👤 My Profile</Link>
              <button onClick={() => { logout(); setMobileOpen(false); navigate('/'); }} style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', padding:'var(--space-3) var(--space-4)', borderRadius:'var(--radius-md)', fontSize:'var(--text-base)', color:'var(--accent-red, #e53e3e)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>🚪 Sign Out</button>
            </>
          ) : (
            <div style={{ display:'flex', gap:'var(--space-3)', marginTop:'var(--space-2)' }}>
              <Link to="/login"    onClick={() => setMobileOpen(false)} className="btn btn-secondary btn-full">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary  btn-full">Sign Up</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) { .desktop-nav-links { display: none !important; } .desktop-search { display: none !important; } .hamburger-btn { display: flex !important; } }
        @media (max-width: 640px)  { .nav-wordmark { display: none; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  );
}
