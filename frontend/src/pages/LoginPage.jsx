import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogIn, AlertCircle } from 'lucide-react';

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
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="card">
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}
        >
          Welcome Back
        </h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Log in to manage your flights and hotel bookings
        </p>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
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
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            <LogIn size={16} />
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
