import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Plane,
  Hotel,
  Luggage,
  User,
  LogOut,
  LogIn,
  Shield,
  Heart,
  Bell,
  Award,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on route changes
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <Plane className="w-6 h-6" style={{ transform: 'rotate(-45deg)' }} />
          <span>TravelGo</span>
        </Link>

        {/* Top Navbar items: ONLY Flights and Hotels */}
        <div className="nav-links">
          <NavLink
            to="/flights"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Plane size={18} />
            <span>Flights</span>
          </NavLink>
          <NavLink
            to="/hotels"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Hotel size={18} />
            <span>Hotels</span>
          </NavLink>
        </div>

        {/* Top Right: Profile Button / Authentication */}
        <div>
          {isAuthenticated ? (
            <div className="profile-menu-container" ref={dropdownRef}>
              <button
                type="button"
                className={`profile-btn ${dropdownOpen ? 'active' : ''}`}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User profile menu"
              >
                <div className="profile-avatar-sm">{initials}</div>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || user?.email}
                </span>
                <ChevronDown
                  size={15}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-muted)',
                  }}
                />
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown" role="menu">
                  {/* Dropdown Header */}
                  <div className="profile-dropdown-header">
                    <span className="profile-dropdown-name">{user?.name || 'My Account'}</span>
                    <span className="profile-dropdown-email">{user?.email}</span>
                    <div style={{ marginTop: '0.35rem' }}>
                      {isAdmin ? (
                        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}>
                          <Shield size={10} /> Admin
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                          <User size={10} /> Traveler
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rest of items moved inside profile dropdown */}
                  <NavLink
                    to="/profile"
                    className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    <span>Edit Profile</span>
                  </NavLink>

                  <NavLink
                    to="/bookings"
                    className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Luggage size={16} />
                    <span>My Bookings</span>
                  </NavLink>

                  <NavLink
                    to="/wishlist"
                    className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Heart size={16} />
                    <span>Wishlist</span>
                  </NavLink>

                  <NavLink
                    to="/price-alerts"
                    className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Bell size={16} />
                    <span>Price Alerts</span>
                  </NavLink>

                  <NavLink
                    to="/loyalty"
                    className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Award size={16} />
                    <span>Rewards</span>
                  </NavLink>

                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `profile-dropdown-item ${isActive ? 'active' : ''}`}
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Shield size={16} />
                      <span>Admin Dashboard</span>
                    </NavLink>
                  )}

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-dropdown-item logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
