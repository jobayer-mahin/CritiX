// src/pages/admin/AdminMovies.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../context/AdminContext';

const EMPTY = {
  type: 'movie', title: '', year: new Date().getFullYear(), rating: '', critics: '',
  genre: '', poster: '', backdrop: '', director: '', tagline: '', synopsis: '', runtime: '', popular: 0
};

export default function AdminMovies() {
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'add' | {movie}
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [search,  setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    adminAPI().get('/admin/movies')
      .then(data => setMovies(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); setMsg(''); };
  const openEdit = (m)  => {
    setForm({ ...m, genre: Array.isArray(m.genre) ? m.genre.join(', ') : m.genre || '' });
    setModal(m);
    setMsg('');
  };

  const handleSave = async () => {
    if (!form.title || !form.year) return setMsg('Title and year are required');
    setSaving(true);
    const payload = { ...form, genre: form.genre.split(',').map(g => g.trim()).filter(Boolean), year: Number(form.year), rating: Number(form.rating) || 0, critics: Number(form.critics) || 0, popular: Number(form.popular) || 0 };
    const api = adminAPI();
    const res = modal === 'add'
      ? await api.post('/admin/movies', payload)
      : await api.put(`/admin/movies/${modal.id}`, payload);
    setSaving(false);
    if (res.error) { setMsg(res.error); return; }
    setModal(null);
    load();
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will remove all associated reviews.`)) return;
    await adminAPI().delete(`/admin/movies/${id}`);
    load();
  };

  const filtered = movies.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Movies & TV Shows</h1>
          <p className="admin-page-sub">{movies.length} titles in database</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>+ Add Title</button>
      </div>

      <div className="admin-search-bar">
        <input
          type="text" placeholder="Search titles…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="admin-input"
        />
      </div>

      {loading ? <div className="admin-loading">Loading…</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Poster</th><th>Title</th><th>Type</th><th>Year</th>
                <th>Rating</th><th>Critics</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <img
                      src={m.poster} alt={m.title}
                      className="admin-movie-thumb"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </td>
                  <td className="admin-movie-title-cell">
                    <div className="admin-movie-name">{m.title}</div>
                    <div className="admin-movie-director">{m.director || '—'}</div>
                  </td>
                  <td><span className={`admin-type-badge ${m.type}`}>{m.type === 'tv' ? 'TV' : 'Movie'}</span></td>
                  <td>{m.year}</td>
                  <td>★ {m.rating}</td>
                  <td>{m.critics}%</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-sm admin-btn-edit" onClick={() => openEdit(m)}>Edit</button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(m.id, m.title)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal === 'add' ? 'Add New Title' : `Edit: ${modal.title}`}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            {msg && <div className="admin-error">{msg}</div>}

            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="admin-input">
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                </select>
              </div>
              <div className="admin-field admin-field-wide">
                <label>Title *</label>
                <input className="admin-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Year *</label>
                <input className="admin-input" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Rating (0–10)</label>
                <input className="admin-input" type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Critics %</label>
                <input className="admin-input" type="number" min="0" max="100" value={form.critics} onChange={e => setForm(f => ({ ...f, critics: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Popular score (0–100)</label>
                <input className="admin-input" type="number" min="0" max="100" value={form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Director</label>
                <input className="admin-input" value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} />
              </div>
              <div className="admin-field">
                <label>Runtime</label>
                <input className="admin-input" placeholder="2h 10m" value={form.runtime} onChange={e => setForm(f => ({ ...f, runtime: e.target.value }))} />
              </div>
              <div className="admin-field admin-field-wide">
                <label>Genres (comma-separated)</label>
                <input className="admin-input" placeholder="Drama, Thriller, Sci-Fi" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
              </div>
              <div className="admin-field admin-field-wide">
                <label>Tagline</label>
                <input className="admin-input" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
              </div>
              <div className="admin-field admin-field-wide">
                <label>Poster URL (or /filename.jpg for local)</label>
                <input className="admin-input" value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))} />
              </div>
              <div className="admin-field admin-field-wide">
                <label>Backdrop / Hero Cover URL</label>
                <input className="admin-input" value={form.backdrop} onChange={e => setForm(f => ({ ...f, backdrop: e.target.value }))} />
              </div>
              <div className="admin-field admin-field-full">
                <label>Synopsis</label>
                <textarea className="admin-input admin-textarea" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} rows={4} />
              </div>
            </div>

            {/* Image previews */}
            {(form.poster || form.backdrop) && (
              <div className="admin-img-preview-row">
                {form.poster && (
                  <div className="admin-img-preview">
                    <div className="admin-img-preview-label">Poster</div>
                    <img src={form.poster} alt="poster preview" />
                  </div>
                )}
                {form.backdrop && (
                  <div className="admin-img-preview admin-img-preview-wide">
                    <div className="admin-img-preview-label">Hero Cover</div>
                    <img src={form.backdrop} alt="backdrop preview" />
                  </div>
                )}
              </div>
            )}

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : modal === 'add' ? 'Add Title' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
