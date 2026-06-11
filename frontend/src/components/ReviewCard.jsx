// src/components/ReviewCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reviewsAPI } from '../api/client';

function Stars({ rating }) {
  return (
    <div className="review-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`star ${i < rating ? 'filled' : ''}`} viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewCard({ review, rankBadge }) {
  const { isLoggedIn } = useAuth();
  const { showToast }  = useToast();
  const navigate       = useNavigate();
  const [liked, setLiked]       = useState(review.liked ?? false);
  const [likes, setLikes]       = useState(review.likes_count ?? 0);
  const [revealed, setRevealed] = useState(false);

  const toggleLike = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    try {
      const { data } = await reviewsAPI.like(review.id);
      setLiked(data.liked);
      setLikes(l => data.liked ? l + 1 : l - 1);
    } catch { showToast('Could not update like', 'error'); }
  };

  const relativeDate = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <article className="review-card" style={{ position: 'relative' }}>
      {rankBadge && (
        <div style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 1, width: 30, height: 30, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ...rankBadgeStyle(rankBadge) }}>
          {rankBadge}
        </div>
      )}

      <div className="review-card-header">
        <div className="review-movie-poster">
          <img src={review.movie_poster} alt={review.movie_title} loading="lazy" />
        </div>
        <div className="review-movie-info">
          <div className="review-movie-title-row">
            <span className="review-movie-title">{review.movie_title}</span>
            <Stars rating={review.rating} />
          </div>
          <div className="review-user-row">
            <div className="review-user-avatar">
              <img src={review.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.username}`} alt={review.username} loading="lazy" />
            </div>
            <span className="review-username">by <a href={`/users/${review.user_id}`} onClick={e => { e.stopPropagation(); }} style={{color:'inherit',textDecoration:'none'}}>@{review.username}</a></span>
          </div>
          <div className="review-badges">
            {review.mood && <span className="badge badge-mood">{review.mood}</span>}
            {review.is_spoiler ? <span className="badge badge-spoiler">⚠ Spoiler</span> : null}
          </div>
        </div>
      </div>

      <div className="review-card-body">
        <div>
          <p className={`review-text ${review.is_spoiler && !revealed ? 'review-spoiler-text' : ''}`}>
            {review.text}
          </p>
          {review.is_spoiler && !revealed && (
            <button className="spoiler-reveal-btn" onClick={() => setRevealed(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Reveal Spoiler
            </button>
          )}
        </div>
        {review.quote && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:'var(--space-2)', marginTop:'var(--space-3)', padding:'var(--space-3)', background:'rgba(255,255,255,.03)', borderRadius:'var(--radius-sm)', borderLeft:'2px solid var(--accent-green)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent-green)" style={{ flexShrink:0, marginTop:2 }}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            <span style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', wordBreak:'break-word' }}>{review.quote}</span>
          </div>
        )}
      </div>

      <div className="review-card-actions">
        <button className={`review-action ${liked ? 'liked' : ''}`} onClick={toggleLike}
          style={{ animation: liked ? 'heartBeat 0.4s ease' : 'none' }}>
          <svg viewBox="0 0 24 24" fill={liked ? 'var(--accent-red)' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{likes}</span>
        </button>
        <button className="review-action" onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied!'); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>
        <button className="review-action" onClick={() => {
          if (!review.id) return;
          fetch(`/api/reviews/${review.id}/report`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } })
            .then(() => showToast('Review reported to admin', 'error'))
            .catch(() => showToast('Could not report review', 'error'));
        }} style={{ marginLeft: 'auto', opacity: 0.5 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          Report
        </button>
        <span className="review-date">{review.created_at ? relativeDate(review.created_at) : (review.date || '')}</span>
      </div>
    </article>
  );
}

function rankBadgeStyle(rank) {
  if (rank === 1) return { background: 'rgba(255,193,7,.15)', color: '#ffc107' };
  if (rank === 2) return { background: 'rgba(176,190,197,.15)', color: '#b0bec5' };
  if (rank === 3) return { background: 'rgba(188,143,143,.15)', color: '#bc8f8f' };
  return { background: 'var(--bg-elevated)', color: 'var(--text-muted)' };
}
