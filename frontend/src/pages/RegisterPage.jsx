import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus, AlertCircle, Plane, Sparkles, Compass, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Column: Visual Travel Hero */}
      <div className="auth-hero-side">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"
          alt="Scenic travel landscape"
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
                <Sparkles size={12} /> Join TravelGo Rewards
              </span>
            </div>
          </div>

          <div>
            <blockquote style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              "The journey of a thousand miles begins with a single booking. Discover the world with us."
            </blockquote>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, margin: 0 }}>
              Exclusive member rates &bull; Real-time flight tracking &bull; Instant loyalty bonus points
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Form Side */}
      <div className="auth-form-side">
        <div className="auth-card-inner">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <span className="stamp-badge stamp-badge-coral" style={{ marginBottom: '0.5rem' }}>
              <Compass size={12} /> Member Registration
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.4rem', color: 'var(--secondary)' }}>
              Create an Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Join TravelGo to search, compare, and book flights and luxury hotels
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
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Amelia Earhart"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="amelia@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Password (min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
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
              <UserPlus size={16} />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
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
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
