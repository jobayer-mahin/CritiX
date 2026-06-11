// src/components/DiscussionComments.jsx
// ─────────────────────────────────────────────────────────────────────
// Full comment + reply system for Discussion posts.
//
// Features:
//  • Fetch & display comments with threaded replies
//  • Create comment / reply with optimistic UI
//  • Edit own comment/reply inline
//  • Delete own comment/reply (soft-delete)
//  • "X ago" relative timestamps
//  • Loading states, error handling, empty states
//  • XSS-safe (server sanitises; client escapes via React)
//  • Mobile responsive

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { commentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ── Helpers ──────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800)return `${Math.floor(secs / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ src, username, size = 28 }) {
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-elevated)' }}>
      <img
        src={src || fallback}
        alt={username}
        onError={e => { e.target.src = fallback; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

// ── CommentInput — shared textarea for new & edit ────────────────────
function CommentInput({ placeholder, onSubmit, onCancel, initialValue = '', submitLabel = 'Post', autoFocus = false }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // move cursor to end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setValue('');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
    if (e.key === 'Escape' && onCancel) onCancel();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={3}
        maxLength={2000}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,.04)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-3)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 'var(--leading-relaxed)',
          fontFamily: 'var(--font-body)',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {value.length}/2000 · Ctrl+Enter to submit
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}>
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}>
            {loading ? '…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SingleReply ───────────────────────────────────────────────────────
function SingleReply({ reply, currentUserId, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);

  const isOwn = currentUserId && reply.user_id === currentUserId;
  const isDeleted = !!reply.is_deleted;

  const handleEdit = async (newBody) => {
    await onEdit(reply.id, newBody);
    setEditing(false);
  };

  return (
    <div style={{
      display: 'flex', gap: 'var(--space-2)',
      paddingTop: 'var(--space-3)',
      opacity: isDeleted ? 0.5 : 1,
    }}>
      <Avatar src={reply.avatar_url} username={reply.username} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-green)' }}>@{reply.username}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{timeAgo(reply.created_at)}</span>
          {reply.updated_at !== reply.created_at && !isDeleted && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>
          )}
        </div>

        {editing ? (
          <CommentInput
            placeholder="Edit reply…"
            initialValue={reply.body}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
            submitLabel="Save"
            autoFocus
          />
        ) : (
          <p style={{ fontSize: 'var(--text-sm)', color: isDeleted ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', margin: 0, wordBreak: 'break-word', fontStyle: isDeleted ? 'italic' : 'normal' }}>
            {reply.body}
          </p>
        )}

        {isOwn && !isDeleted && !editing && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
            <ActionBtn onClick={() => setEditing(true)}>Edit</ActionBtn>
            <ActionBtn onClick={() => onDelete(reply.id)} danger>Delete</ActionBtn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SingleComment ─────────────────────────────────────────────────────
function SingleComment({ comment, replies, currentUserId, onEdit, onDelete, onReply, isMuted = false }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [editing, setEditing]           = useState(false);

  const isOwn     = currentUserId && comment.user_id === currentUserId;
  const isDeleted = !!comment.is_deleted;

  const handleEdit = async (newBody) => {
    await onEdit(comment.id, newBody);
    setEditing(false);
  };

  const handleReply = async (body) => {
    await onReply(comment.id, body);
    setShowReplyBox(false);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-4)',
      transition: 'border-color var(--transition-base)',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Comment header */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <Avatar src={comment.avatar_url} username={comment.username} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-green)' }}>@{comment.username}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && !isDeleted && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>
            )}
          </div>

          {editing ? (
            <CommentInput
              placeholder="Edit comment…"
              initialValue={comment.body}
              onSubmit={handleEdit}
              onCancel={() => setEditing(false)}
              submitLabel="Save"
              autoFocus
            />
          ) : (
            <p style={{
              fontSize: 'var(--text-sm)',
              color: isDeleted ? 'var(--text-muted)' : 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0, marginBottom: 'var(--space-2)',
              wordBreak: 'break-word',
              fontStyle: isDeleted ? 'italic' : 'normal',
              opacity: isDeleted ? 0.6 : 1,
            }}>
              {comment.body}
            </p>
          )}

          {!editing && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              {!isDeleted && currentUserId && !isMuted && (
                <ActionBtn onClick={() => setShowReplyBox(r => !r)}>
                  {showReplyBox ? '↩ Cancel' : '↩ Reply'}
                </ActionBtn>
              )}
              {isOwn && !isDeleted && (
                <>
                  <ActionBtn onClick={() => setEditing(true)}>Edit</ActionBtn>
                  <ActionBtn onClick={() => onDelete(comment.id)} danger>Delete</ActionBtn>
                </>
              )}
              {replies.length > 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply input box */}
      {showReplyBox && (
        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)', paddingLeft: 'calc(32px + var(--space-3))' }}>
          <CommentInput
            placeholder={`Reply to @${comment.username}…`}
            onSubmit={handleReply}
            onCancel={() => setShowReplyBox(false)}
            submitLabel="Post Reply"
            autoFocus
          />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-2)',
          paddingLeft: 'calc(32px + var(--space-3))',
          borderTop: '1px solid var(--border)',
          borderLeft: '2px solid rgba(0,224,84,.15)',
          marginLeft: 'calc(32px / 2)',
        }}>
          {replies.map(r => (
            <SingleReply
              key={r.id}
              reply={r}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Small ghost action button
function ActionBtn({ onClick, children, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
        fontSize: 'var(--text-xs)',
        color: danger ? 'var(--accent-red)' : 'var(--text-muted)',
        transition: 'color var(--transition-fast)',
      }}
      onMouseEnter={e => e.currentTarget.style.color = danger ? 'var(--accent-red)' : 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = danger ? 'var(--accent-red)' : 'var(--text-muted)'}
    >
      {children}
    </button>
  );
}

// ── Main DiscussionComments component ────────────────────────────────
export default function DiscussionComments({ discussionId, isMuted = false }) {
  const { user, isLoggedIn } = useAuth();
  const { showToast }        = useToast();
  const navigate             = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── Fetch all comments ──────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await commentsAPI.getByDiscussion(discussionId);
      setComments(data);
    } catch {
      setError('Could not load comments.');
    } finally {
      setLoading(false);
    }
  }, [discussionId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // ── Post new top-level comment ──────────────────────────────────
  const handleNewComment = async (body) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    // Optimistic add
    const optimistic = {
      id: `opt-${Date.now()}`, discussion_id: discussionId,
      parent_id: null, body, is_deleted: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      user_id: user.id, username: user.username, avatar_url: user.avatar_url,
    };
    setComments(prev => [optimistic, ...prev]);
    try {
      const { data } = await commentsAPI.create(discussionId, body);
      // Replace optimistic with real
      setComments(prev => prev.map(c => c.id === optimistic.id ? data : c));
      showToast('Comment posted! 💬');
    } catch (err) {
      // Rollback
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      showToast(err.response?.data?.error || 'Could not post comment', 'error');
    }
  };

  // ── Post reply ──────────────────────────────────────────────────
  const handleReply = async (parentId, body) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const optimistic = {
      id: `opt-${Date.now()}`, discussion_id: discussionId,
      parent_id: parentId, body, is_deleted: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      user_id: user.id, username: user.username, avatar_url: user.avatar_url,
    };
    setComments(prev => [...prev, optimistic]);
    try {
      const { data } = await commentsAPI.reply(discussionId, parentId, body);
      setComments(prev => prev.map(c => c.id === optimistic.id ? data : c));
      showToast('Reply posted!');
    } catch (err) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      showToast(err.response?.data?.error || 'Could not post reply', 'error');
    }
  };

  // ── Edit ────────────────────────────────────────────────────────
  const handleEdit = async (commentId, newBody) => {
    // Optimistic update
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, body: newBody, updated_at: new Date().toISOString() } : c
    ));
    try {
      const { data } = await commentsAPI.edit(commentId, newBody);
      setComments(prev => prev.map(c => c.id === commentId ? data : c));
      showToast('Comment updated');
    } catch (err) {
      fetchComments(); // re-sync on failure
      showToast(err.response?.data?.error || 'Could not update comment', 'error');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    // Optimistic soft-delete display
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, is_deleted: 1, body: '[comment deleted]' } : c
    ));
    try {
      await commentsAPI.delete(commentId);
      showToast('Comment deleted');
    } catch (err) {
      fetchComments();
      showToast(err.response?.data?.error || 'Could not delete comment', 'error');
    }
  };

  // ── Build tree: group replies under parents ──────────────────────
  const topLevel = comments.filter(c => c.parent_id == null);
  const repliesOf = (parentId) => comments.filter(c => c.parent_id === parentId || c.parent_id === String(parentId));

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Comments {!loading && `(${topLevel.length})`}
        </span>
      </div>

      {/* New comment input — hidden for muted users */}
      {isLoggedIn && isMuted ? (
        <div style={{ background: 'rgba(255,170,0,.08)', border: '1px solid rgba(255,170,0,.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 'var(--text-sm)', color: '#ffaa00' }}>
            Your account is muted. You cannot post comments.
          </span>
        </div>
      ) : isLoggedIn ? (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', alignItems: 'flex-start' }}>
          <Avatar src={user?.avatar_url} username={user?.username || 'you'} size={32} />
          <div style={{ flex: 1 }}>
            <CommentInput
              placeholder="Write a comment…"
              onSubmit={handleNewComment}
              submitLabel="Comment"
            />
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)', textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <button onClick={() => navigate('/login')} style={{ color: 'var(--accent-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Sign in</button>{' '}
            to join the conversation
          </span>
        </div>
      )}

      {/* Comment list */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--accent-red-dim)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-red)', fontSize: 'var(--text-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={fetchComments} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: 'var(--text-xs)', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {!loading && !error && topLevel.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          No comments yet. Be the first to share your thoughts!
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {topLevel.map(comment => (
            <SingleComment
              key={comment.id}
              comment={comment}
              replies={repliesOf(comment.id)}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
              isMuted={isMuted}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
