// src/pages/admin/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLogin() {
  const { adminLogin } = useAdmin();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      // Extract the most descriptive error message available
      const msg =
        err?.response?.data?.error ||   // axios error body
        err?.message ||                  // network / JS error
        'Could not connect to server. Make sure the backend is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="admin-logo-icon">🎬</span>
          <h1>Critix <span className="admin-badge">Admin</span></h1>
        </div>
        <p className="admin-login-subtitle">Sign in to the admin panel</p>

        {error && (
          <div className="admin-error" style={{ marginBottom: '1rem' }}>
            <strong>Login failed:</strong> {error}
            {error.toLowerCase().includes('server') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.85 }}>
                💡 Make sure the backend is running and the <code>admins</code> table exists in MySQL.
                Run <code>node setup-admin.js</code> in the backend folder to fix this.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label>Email</label>
            <input
              className="admin-input"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="admin-field">
            <label>Password</label>
            <input
              className="admin-input"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="admin-back-link">
          <a href="/">← Back to Critix</a>
        </p>
      </div>
    </div>
  );
}
