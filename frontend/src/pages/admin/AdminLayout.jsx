// src/pages/admin/AdminLayout.jsx
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminLayout() {
  const { admin, adminLogout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/movies',    icon: '🎬', label: 'Movies & TV' },
    { to: '/admin/users',     icon: '👥', label: 'Users' },
    { to: '/admin/reviews',   icon: '⭐', label: 'Reviews' },
    { to: '/admin/reported',  icon: '🚨', label: 'Reported' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">🎬</span>
          <div>
            <div className="admin-sidebar-title">Critix</div>
            <div className="admin-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {admin?.first_name?.[0]}{admin?.last_name?.[0]}
            </div>
            <div>
              <div className="admin-sidebar-name">{admin?.first_name} {admin?.last_name}</div>
              <div className="admin-sidebar-role">Administrator</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
