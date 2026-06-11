// src/hooks/useFetch.js — Generic data-fetching hook
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch(fetchFn, deps)
 * fetchFn must return a Promise that resolves to the data.
 * Re-runs whenever deps change.
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) setError(err?.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => { mounted.current = false; };
  }, [run]);

  return { data, loading, error, refetch: run };
}

// ─── useMovies ───────────────────────────────────────────────
import { moviesAPI } from '../api/client';

export function useMovies(params = {}) {
  const key = JSON.stringify(params);
  return useFetch(() => moviesAPI.getAll(params).then(r => r.data), [key]);
}

export function useMovie(id) {
  return useFetch(() => moviesAPI.getById(id).then(r => r.data), [id]);
}

export function useFeaturedMovies() {
  return useFetch(() => moviesAPI.getFeatured().then(r => r.data), []);
}

// ─── useReviews ──────────────────────────────────────────────
import { reviewsAPI } from '../api/client';

export function useReviews(params = {}) {
  const key = JSON.stringify(params);
  return useFetch(() => reviewsAPI.getAll(params).then(r => r.data), [key]);
}

// ─── useDiscussions ──────────────────────────────────────────
import api from '../api/client';

export function useDiscussions(params = {}) {
  const key = JSON.stringify(params);
  return useFetch(() => api.get('/discussions', { params }).then(r => r.data), [key]);
}

// ─── useWatchlist ────────────────────────────────────────────
export function useWatchlist() {
  return useFetch(() => moviesAPI.getWatchlist().then(r => r.data), []);
}
