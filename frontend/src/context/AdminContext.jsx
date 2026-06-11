// src/context/AdminContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const saved = localStorage.getItem('adminUser');
    if (token && saved) {
      setAdmin(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data.admin;
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return (
    <AdminContext.Provider value={{ admin, loading, adminLogin, adminLogout, isAdmin: !!admin }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);

// Admin-specific axios helper that uses adminToken
export function adminAPI() {
  const token = localStorage.getItem('adminToken');
  return {
    get:    (url, cfg)     => fetch(`/api${url}`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...cfg }).then(r => r.json()),
    post:   (url, body)    => fetch(`/api${url}`, { method: 'POST',   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    put:    (url, body)    => fetch(`/api${url}`, { method: 'PUT',    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    patch:  (url, body)    => fetch(`/api${url}`, { method: 'PATCH',  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    delete: (url)          => fetch(`/api${url}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }).then(r => r.json()),
  };
}
