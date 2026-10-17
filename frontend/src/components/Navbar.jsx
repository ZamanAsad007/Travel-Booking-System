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
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  // Transparent-on-scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Handle body scroll locking when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  // Click outside and escape handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
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
    <>
      <nav className={`navbar navbar-solid ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-container">
          {/* Brand Logo */}
          <Link to="/" className="nav-brand">
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
              }}
            >
              <Plane size={20} style={{ transform: 'rotate(-45deg)' }} />
            </span>
            <span>TravelGo</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links desktop-only">
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
            <NavLink
              to="/flights?deal=bundle"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Sparkles size={17} style={{ color: 'var(--accent)' }} />
              <span>Deals</span>
              <span
                className="stamp-badge"
                style={{
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.65rem',
                  marginLeft: '0.15rem',
                  backgroundColor: 'var(--accent-light)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                15% OFF
              </span>
            </NavLink>
          </div>

          {/* Right Header Area: Desktop User Account / Auth & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="nav-user-desktop">
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
                    <span
                      style={{
                        maxWidth: '130px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.name || user?.email}
                    </span>
                    <ChevronDown
                      size={15}
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'currentColor',
                        opacity: 0.8,
                      }}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="profile-dropdown" role="menu">
                      {/* Dropdown Header */}
                      <div className="profile-dropdown-header">
                        <span className="profile-dropdown-name">{user?.name || 'Traveler'}</span>
                        <span className="profile-dropdown-email">{user?.email}</span>
                        <div style={{ marginTop: '0.4rem' }}>
                          {isAdmin ? (
                            <span
                              className="badge"
                              style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.7rem' }}
                            >
                              <Shield size={10} /> Admin
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem' }}
                            >
                              <User size={10} /> Traveler
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
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
                        <span>Rewards & Loyalty</span>
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
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <Link
                    to="/login"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.88rem',
                    }}
                  >
                    <LogIn size={15} />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile navigation menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <aside
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          <div className="mobile-drawer-header">
            <Link to="/" className="nav-brand" onClick={() => setMobileDrawerOpen(false)}>
              <span
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--primary-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <Plane size={18} style={{ transform: 'rotate(-45deg)' }} />
              </span>
              <span>TravelGo</span>
            </Link>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close navigation drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mobile-drawer-body">
            {/* Primary Nav Links */}
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Explore
              </span>
              <div className="mobile-nav-list">
                <NavLink
                  to="/flights"
                  className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <Plane size={18} />
                  <span>Flights</span>
                </NavLink>
                <NavLink
                  to="/hotels"
                  className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <Hotel size={18} />
                  <span>Hotels</span>
                </NavLink>
                <NavLink
                  to="/flights?deal=bundle"
                  className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                  <span>Deals & Packages</span>
                </NavLink>
              </div>
            </div>

            {/* Account / User Section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              {isAuthenticated ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--sand)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div className="profile-avatar-sm">{initials}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                        {user?.name || 'Traveler'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="mobile-nav-list">
                    <NavLink
                      to="/profile"
                      className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <User size={18} />
                      <span>Edit Profile</span>
                    </NavLink>
                    <NavLink
                      to="/bookings"
                      className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Luggage size={18} />
                      <span>My Bookings</span>
                    </NavLink>
                    <NavLink
                      to="/wishlist"
                      className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Heart size={18} />
                      <span>Wishlist</span>
                    </NavLink>
                    <NavLink
                      to="/price-alerts"
                      className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Bell size={18} />
                      <span>Price Alerts</span>
                    </NavLink>
                    <NavLink
                      to="/loyalty"
                      className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Award size={18} />
                      <span>Rewards & Loyalty</span>
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setMobileDrawerOpen(false)}
                      >
                        <Shield size={18} />
                        <span>Admin Dashboard</span>
                      </NavLink>
                    )}
                    <button
                      type="button"
                      className="mobile-nav-item"
                      style={{
                        background: 'none',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                        marginTop: '0.5rem',
                      }}
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link
                    to="/login"
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    <LogIn size={16} />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
