// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider }    from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { ToastProvider }   from './context/ToastContext';
import ErrorBoundary       from './components/ErrorBoundary';
import ProtectedRoute      from './components/ProtectedRoute';
import Navbar              from './components/Navbar';
import Home                from './pages/Home';
import Browse              from './pages/Browse';
import MovieDetail         from './pages/MovieDetail';
import Community           from './pages/Community';
import AddReview           from './pages/AddReview';
import Profile             from './pages/Profile';
import UserProfile         from './pages/UserProfile';
import Search              from './pages/Search';
import NotFound            from './pages/NotFound';
import { Login, Register } from './pages/Auth';

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies    from './pages/admin/AdminMovies';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminReviews   from './pages/admin/AdminReviews';

import { NavHintProvider } from './context/NavHintContext';
import './styles/global.css';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Guard: redirect to /login if not admin
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <ToastProvider>
            <NavHintProvider>
            <ErrorBoundary>
              <ScrollToTop />
              <Routes>
                {/* ── Public & user routes (with Navbar) ── */}
                <Route path="/"           element={<><Navbar /><Home /></>} />
                <Route path="/movies"     element={<><Navbar /><Browse mediaType="movie" /></>} />
                <Route path="/movies/:id" element={<><Navbar /><MovieDetail /></>} />
                <Route path="/tv"         element={<><Navbar /><Browse mediaType="tv" /></>} />
                <Route path="/community"  element={<><Navbar /><Community /></>} />
                <Route path="/search"     element={<><Navbar /><Search /></>} />
                <Route path="/login"      element={<Login />} />
                <Route path="/register"   element={<Register />} />
                <Route path="/users/:id"  element={<><Navbar /><UserProfile /></>} />

                <Route path="/add-review" element={<><Navbar /><ProtectedRoute><AddReview /></ProtectedRoute></>} />
                <Route path="/profile"    element={<><Navbar /><ProtectedRoute><Profile /></ProtectedRoute></>} />

                {/* ── Admin routes (no Navbar) ── */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="movies"    element={<AdminMovies />} />
                  <Route path="users"     element={<AdminUsers />} />
                  <Route path="reviews"   element={<AdminReviews />} />
                  <Route path="reported"  element={<AdminReviews reportedOnly />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
            </NavHintProvider>
          </ToastProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
