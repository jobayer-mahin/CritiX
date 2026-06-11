// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../context/AdminContext';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    adminAPI().get('/admin/users')
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleBan = async (u) => {
    const msg = u.is_banned ? 'Unban' : 'Ban';
    if (!confirm(`${msg} user "${u.username}"?`)) return;
    await adminAPI().patch(`/admin/users/${u.id}/ban`, { banned: !u.is_banned });
    load();
  };

  const toggleMute = async (u) => {
    const msg = u.is_muted ? 'Unmute' : 'Mute';
    if (!confirm(`${msg} user "${u.username}"? ${!u.is_muted ? 'They will not be able to post reviews or discussions.' : ''}`)) return;
    await adminAPI().patch(`/admin/users/${u.id}/mute`, { muted: !u.is_muted });
    load();
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-sub">{users.length} registered members</p>
        </div>
      </div>

      <div className="admin-search-bar">
        <input
          type="text" placeholder="Search by username or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="admin-input"
        />
      </div>

      {loading ? <div className="admin-loading">Loading users…</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th><th>Email</th><th>Reviews</th>
                <th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={u.is_banned ? 'admin-row-banned' : ''}>
                  <td>
                    <div className="admin-user-cell">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.username} className="admin-user-avatar" />
                        : <div className="admin-user-avatar-placeholder">{u.username[0].toUpperCase()}</div>
                      }
                      <span className="admin-user-name">@{u.username}</span>
                    </div>
                  </td>
                  <td className="admin-text-muted">{u.email}</td>
                  <td>{u.review_count ?? 0}</td>
                  <td className="admin-text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-status-badges">
                      {u.is_banned
                        ? <span className="admin-status-badge admin-status-banned">Banned</span>
                        : u.is_muted
                        ? <span className="admin-status-badge admin-status-muted">Muted</span>
                        : <span className="admin-status-badge admin-status-active">Active</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className={`admin-btn admin-btn-sm ${u.is_muted ? 'admin-btn-edit' : 'admin-btn-warning'}`}
                        onClick={() => toggleMute(u)}
                      >
                        {u.is_muted ? 'Unmute' : 'Mute'}
                      </button>
                      <button
                        className={`admin-btn admin-btn-sm ${u.is_banned ? 'admin-btn-edit' : 'admin-btn-danger'}`}
                        onClick={() => toggleBan(u)}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
