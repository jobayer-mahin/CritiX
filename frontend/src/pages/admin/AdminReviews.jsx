// src/pages/admin/AdminReviews.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../context/AdminContext';

export default function AdminReviews({ reportedOnly = false }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    adminAPI().get(`/admin/reviews${reportedOnly ? '?reported=1' : ''}`)
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [reportedOnly]);

  const deleteReview = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    await adminAPI().delete(`/admin/reviews/${id}`);
    load();
  };

  const dismissReport = async (id) => {
    await adminAPI().patch(`/admin/reviews/${id}/dismiss-report`, {});
    load();
  };

  const filtered = reviews.filter(r =>
    (r.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.movie_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.text || '').toLowerCase().includes(search.toLowerCase())
  );

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {reportedOnly ? '🚨 Reported Reviews' : 'All Reviews'}
          </h1>
          <p className="admin-page-sub">
            {reviews.length} {reportedOnly ? 'reported' : 'total'} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="admin-search-bar">
        <input
          type="text" placeholder="Search by user, movie, or content…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="admin-input"
        />
      </div>

      {loading ? <div className="admin-loading">Loading reviews…</div> : filtered.length === 0 ? (
        <div className="admin-empty">
          <span>{reportedOnly ? '✅' : '📭'}</span>
          <p>{reportedOnly ? 'No reported reviews — all clear!' : 'No reviews found'}</p>
        </div>
      ) : (
        <div className="admin-review-list">
          {filtered.map(r => (
            <div key={r.id} className={`admin-review-card ${r.reported ? 'admin-review-reported' : ''}`}>
              <div className="admin-review-top">
                <div className="admin-review-meta">
                  <div className="admin-review-user">
                    {r.avatar_url
                      ? <img src={r.avatar_url} alt={r.username} className="admin-user-avatar admin-user-avatar-sm" />
                      : <div className="admin-user-avatar-placeholder admin-avatar-sm">{(r.username || '?')[0].toUpperCase()}</div>
                    }
                    <span className="admin-review-username">@{r.username}</span>
                  </div>
                  <span className="admin-review-movie">on <strong>{r.movie_title}</strong></span>
                  <span className="admin-review-stars" style={{ color: '#ff8800' }}>{stars(r.rating)}</span>
                  <span className="admin-text-muted" style={{ fontSize: '0.75rem' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  {r.reported ? <span className="admin-status-badge admin-status-banned">Reported</span> : null}
                  {r.is_spoiler ? <span className="admin-status-badge admin-status-muted">Spoiler</span> : null}
                </div>
                <div className="admin-actions">
                  {r.reported && (
                    <button className="admin-btn admin-btn-sm admin-btn-edit" onClick={() => dismissReport(r.id)}>
                      Dismiss
                    </button>
                  )}
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => deleteReview(r.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="admin-review-text">{r.text}</p>
              {r.quote && <blockquote className="admin-review-quote">"{r.quote}"</blockquote>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
