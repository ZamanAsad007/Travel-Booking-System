import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Plane, Hotel, Luggage, User, LogOut, LogIn, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <Plane className="w-6 h-6" style={{ transform: 'rotate(-45deg)' }} />
          <span>TravelGo</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/flights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Plane size={18} />
            <span>Flights</span>
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Hotel size={18} />
            <span>Hotels</span>
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Luggage size={18} />
              <span>My Bookings</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              <span>Admin</span>
            </NavLink>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={16} />
                {user?.name || user?.email}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogIn size={15} />
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
