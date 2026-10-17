import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, AlertCircle, Plane, ShieldCheck, Compass, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = location.state?.from;
  const fromPath = typeof fromLocation === 'string' ? fromLocation : fromLocation?.pathname || '/';
  const fromState = fromLocation?.state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(fromPath, { state: fromState, replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Column: Visual Travel Hero */}
      <div className="auth-hero-side">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
          alt="Tropical paradise"
          className="auth-hero-bg"
          decoding="async"
          loading="eager"
        />
        <div className="auth-hero-overlay">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plane size={20} color="#FFFFFF" />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                TravelGo
              </span>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <span className="stamp-badge" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' }}>
                <ShieldCheck size={12} /> Trusted Booking Platform
              </span>
            </div>
          </div>

          <div>
            <blockquote style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              "Your next great adventure begins here. Boarding pass in hand, world at your feet."
            </blockquote>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, margin: 0 }}>
              Live inventory tracking &bull; Instant seat reservation &bull; Verified reviews
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Form Side */}
      <div className="auth-form-side">
        <div className="auth-card-inner">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <span className="stamp-badge stamp-badge-teal" style={{ marginBottom: '0.5rem' }}>
              <Compass size={12} /> Traveler Portal
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.4rem', color: 'var(--secondary)' }}>
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Sign in to manage your flight tickets and hotel bookings
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                border: '1px solid #fca5a5',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Signing in...' : 'Sign In to TravelGo'}</span>
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: '1.75rem',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
            }}
          >
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
