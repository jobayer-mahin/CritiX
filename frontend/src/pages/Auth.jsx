// src/pages/Auth.jsx  — Login + Register + Admin Login
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../context/ToastContext';

// ── Split Layout Wrapper ─────────────────────────────────────
function AuthCard({ title, subtitle, bgImage, children }) {
  return (
    <main style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="auth-left" style={{ flex: '0 0 58%', position: 'relative', overflow: 'hidden' }}>
        <img src={bgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.3), rgba(0,0,0,.6))' }} />
        <p style={{ position: 'absolute', bottom: 32, left: 32, fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', margin: 0 }}>
          Subtle Thoughts on Cinema
        </p>
      </div>

      <div style={{ flex: 1, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '9999px', border: '2px solid rgba(255,255,255,.12)', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', marginBottom: '1rem' }}>
              <img src="/logo.png" alt="Critix" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-family:var(--font-display);font-size:22px;font-weight:700;color:#000">C</span>'; e.target.parentElement.style.background = 'var(--accent-green)'; }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>{title}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '1.5rem', padding: '2rem' }}>
            {children}
          </div>
        </div>
      </div>
      <style>{`.auth-left { display: flex; flex-direction: column; } @media (max-width: 768px) { .auth-left { display: none !important; } }`}</style>
    </main>
  );
}

const inp = (hasErr) => ({
  width: '100%', background: 'rgba(255,255,255,.05)',
  border: `1px solid ${hasErr ? 'var(--accent-red)' : 'var(--border)'}`,
  borderRadius: 'var(--radius-md)', padding: '0.65rem 1rem',
  fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
  outline: 'none', transition: 'border-color 220ms ease, background 220ms ease',
  marginBottom: hasErr ? 4 : '1rem', boxSizing: 'border-box',
});
const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' };

// ── Tab switcher ─────────────────────────────────────────────
function LoginTabs({ active, onChange }) {
  const tabs = [
    { id: 'user',  label: '🎬 Sign In' },
    { id: 'admin', label: '🛡️ Admin' },
  ];
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,.04)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: '0.5rem', border: 'none', borderRadius: 'calc(var(--radius-md) - 2px)',
          background: active === t.id ? (t.id === 'admin' ? 'rgba(255,136,0,.15)' : 'var(--accent-green)') : 'transparent',
          color: active === t.id ? (t.id === 'admin' ? '#ff8800' : '#000') : 'var(--text-secondary)',
          fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
          borderColor: active === t.id && t.id === 'admin' ? 'rgba(255,136,0,.3)' : 'transparent',
          transition: 'all 200ms ease',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  LOGIN PAGE  (user + admin tabs)
// ════════════════════════════════════════════════════════════
export function Login() {
  const { login }       = useAuth();
  const { adminLogin }  = useAdmin();
  const { showToast }   = useToast();
  const navigate        = useNavigate();
  const location        = useLocation();
  const redirectTo      = location.state?.from || '/';

  const [tab,     setTab]     = useState('user');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]     = useState('');
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const isAdmin = tab === 'admin';

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!pass)  errs.pass  = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isAdmin) {
        await adminLogin(email, pass);
        showToast('Welcome, Admin! 🛡️');
        navigate('/admin/dashboard');
      } else {
        await login(email, pass);
        showToast('Welcome back! 🎬');
        navigate(redirectTo);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || (isAdmin ? 'Invalid admin credentials' : 'Invalid email or password');
      showToast(msg, 'error');
    } finally { setLoading(false); }
  };

  const accentColor = isAdmin ? '#ff8800' : 'var(--accent-green)';
  const btnTextColor = isAdmin ? '#000' : '#000';

  return (
    <AuthCard title="Welcome back" subtitle={isAdmin ? 'Admin access only' : 'Sign in to continue your cinematic journey'} bgImage="/login-bg.jpg">
      <LoginTabs active={tab} onChange={(t) => { setTab(t); setErrors({}); setEmail(''); setPass(''); }} />

      <form onSubmit={submit}>
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: 'rgba(255,136,0,.08)', border: '1px solid rgba(255,136,0,.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#ff8800' }}>
            <span>🛡️</span>
            <span>Restricted — Admin credentials only</span>
          </div>
        )}

        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder={isAdmin ? 'tajinahmed007@gmail.com' : 'you@example.com'}
          style={inp(errors.email)}
          onFocus={e => e.target.style.borderColor = isAdmin ? 'rgba(255,136,0,.6)' : 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = errors.email ? 'var(--accent-red)' : 'var(--border)'} />
        {errors.email && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>{errors.email}</p>}

        <label style={labelStyle}>Password</label>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)}
          placeholder="••••••••"
          style={inp(errors.pass)}
          onFocus={e => e.target.style.borderColor = isAdmin ? 'rgba(255,136,0,.6)' : 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = errors.pass ? 'var(--accent-red)' : 'var(--border)'} />
        {errors.pass && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>{errors.pass}</p>}

        <button type="submit" disabled={loading} style={{
          width: '100%', background: accentColor, color: btnTextColor, border: 'none',
          borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.9rem',
          fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          transition: 'opacity 150ms ease, transform 150ms ease', marginTop: '0.5rem',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => e.target.style.transform = 'none'}>
          {loading ? 'Signing in…' : isAdmin ? '🛡️ Enter Admin Panel' : 'Sign In'}
        </button>

        {!isAdmin && (
          <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0,224,84,.05)', border: '1px solid rgba(0,224,84,.15)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <strong style={{ color: 'var(--accent-green)' }}>Demo:</strong>{' '}jobayer@example.com / password123
          </div>
        )}
      </form>

      {!isAdmin && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Sign up</Link>
        </p>
      )}
    </AuthCard>
  );
}

// ════════════════════════════════════════════════════════════
//  REGISTER PAGE
// ════════════════════════════════════════════════════════════
export function Register() {
  const { register }   = useAuth();
  const { showToast }  = useToast();
  const navigate       = useNavigate();

  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username)                  errs.username = 'Username is required';
    if (!form.email)                     errs.email    = 'Email is required';
    if (form.password.length < 6)        errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm)  errs.confirm  = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      showToast('Account created! Welcome to Critix 🎬');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed', 'error');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'username', label: 'Username',        type: 'text',     ph: 'cinephile123' },
    { key: 'email',    label: 'Email',            type: 'email',    ph: 'you@example.com' },
    { key: 'password', label: 'Password',         type: 'password', ph: '••••••••' },
    { key: 'confirm',  label: 'Confirm Password', type: 'password', ph: '••••••••' },
  ];

  return (
    <AuthCard title="Join Critix" subtitle="Explore the world of cinema in a subtle way" bgImage="/register-bg.jpg">
      <form onSubmit={submit}>
        {fields.map(({ key, label, type, ph }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={form[key]} onChange={set(key)} placeholder={ph}
              style={inp(errors[key])}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = errors[key] ? 'var(--accent-red)' : 'var(--border)'} />
            {errors[key] && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>{errors[key]}</p>}
          </div>
        ))}
        <button type="submit" disabled={loading} style={{
          width: '100%', background: 'var(--accent-green)', color: '#000', border: 'none',
          borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.9rem',
          fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          transition: 'opacity 150ms ease, transform 150ms ease', marginTop: '0.5rem',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => e.target.style.transform = 'none'}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </AuthCard>
  );
}
