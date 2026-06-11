// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../context/AdminContext';
import { useAdmin } from '../../context/AdminContext';

export default function AdminDashboard() {
  const { admin } = useAdmin();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI().get('/admin/stats')
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: '🎬', label: 'Movies & TV Shows', value: stats.movies,   color: '#ff8800' },
    { icon: '👥', label: 'Registered Users',  value: stats.users,    color: '#00d4aa' },
    { icon: '⭐', label: 'Total Reviews',      value: stats.reviews,  color: '#6c63ff' },
    { icon: '🚨', label: 'Reported Reviews',   value: stats.reported, color: '#ff4757' },
  ] : [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Welcome back, {admin?.first_name}!</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading stats…</div>
      ) : (
        <div className="admin-stats-grid">
          {statCards.map(card => (
            <div key={card.label} className="admin-stat-card" style={{ '--card-color': card.color }}>
              <div className="admin-stat-icon">{card.icon}</div>
              <div className="admin-stat-value">{card.value}</div>
              <div className="admin-stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-quick-links">
        <h2>Quick Actions</h2>
        <div className="admin-quick-grid">
          {[
            { href: '/admin/movies?action=add', icon: '➕', label: 'Add Movie / TV Show' },
            { href: '/admin/users',             icon: '🔍', label: 'Manage Users' },
            { href: '/admin/reported',          icon: '🚨', label: 'Review Reports' },
            { href: '/',                        icon: '🏠', label: 'View Site' },
          ].map(item => (
            <a key={item.label} href={item.href} className="admin-quick-card">
              <span className="admin-quick-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
