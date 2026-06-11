// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // While restoring session from localStorage, show nothing (avoids flash-redirect)
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</div>
    </div>
  );

  if (!isLoggedIn) {
    // Preserve the intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
