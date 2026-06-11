// src/api/client.js — Axios instance with JWT interceptor
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Helpers ────────────────────────────────────────────────
export const moviesAPI = {
  getAll:      (params) => api.get('/movies', { params }),
  getFeatured: ()       => api.get('/movies/featured'),
  getById:     (id)     => api.get(`/movies/${id}`),
  create:      (data)   => api.post('/movies', data),
  addWatchlist:    (id) => api.post(`/movies/${id}/watchlist`),
  removeWatchlist: (id) => api.delete(`/movies/${id}/watchlist`),
  getWatchlist:    ()   => api.get('/movies/user/watchlist'),
};

export const reviewsAPI = {
  getAll:  (params) => api.get('/reviews', { params }),
  getById: (id)     => api.get(`/reviews/${id}`),
  create:  (data)   => api.post('/reviews', data),
  update:  (id, d)  => api.put(`/reviews/${id}`, d),
  delete:  (id)     => api.delete(`/reviews/${id}`),
  like:    (id)     => api.post(`/reviews/${id}/like`),
};

export const authAPI = {
  register:     (data) => api.post('/auth/register', data),
  login:        (data) => api.post('/auth/login', data),
  me:           ()     => api.get('/auth/me'),
  update:       (data) => api.patch('/auth/me', data),
  getUser:      (id)   => api.get(`/auth/users/${id}`),
  getUserReviews:    (id) => api.get(`/auth/users/${id}/reviews`),
  getUserFollowers:  (id) => api.get(`/auth/users/${id}/followers`),
  getUserFollowing:  (id) => api.get(`/auth/users/${id}/following`),
  followUser:   (id)   => api.post(`/auth/users/${id}/follow`),
  unfollowUser: (id)   => api.delete(`/auth/users/${id}/follow`),
  getNotifications: ()      => api.get('/auth/notifications'),
  markNotificationsRead: () => api.patch('/auth/notifications/read'),
};

export const discussionsAPI = {
  getAll:  (params) => api.get('/discussions', { params }),
  getById: (id)     => api.get(`/discussions/${id}`),
  create:  (data)   => api.post('/discussions', data),
  like:    (id)     => api.post(`/discussions/${id}/like`),
  delete:  (id)     => api.delete(`/discussions/${id}`),
  // Track a view — call ONLY when user intentionally opens/views a discussion.
  // Never call during like, comment, or any other interaction.
  trackView: (id)   => api.post(`/discussions/${id}/view`),
};

// ── NEW: Discussion Comments API ─────────────────────────────
export const commentsAPI = {
  // Fetch all comments (+ replies) for a discussion
  getByDiscussion: (discussionId) =>
    api.get(`/discussions/${discussionId}/comments`),

  // Post a new top-level comment
  create: (discussionId, body) =>
    api.post(`/discussions/${discussionId}/comments`, { body }),

  // Reply to a comment
  reply: (discussionId, parentCommentId, body) =>
    api.post(`/discussions/${discussionId}/comments/${parentCommentId}/replies`, { body }),

  // Edit own comment or reply
  edit: (commentId, body) =>
    api.put(`/comments/${commentId}`, { body }),

  // Soft-delete own comment or reply
  delete: (commentId) =>
    api.delete(`/comments/${commentId}`),
};
