import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  MapPin,
  Compass,
  ShieldCheck,
  Sparkles,
  Luggage,
  Hotel,
  Heart,
  Bell,
  Award,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      {/* Decorative Dotted Flight Path Motif */}
      <div className="footer-flight-path">
        <div className="footer-flight-track">
          <div className="footer-flight-node">
            <MapPin size={14} style={{ color: 'var(--accent)' }} />
            <span>ORIGIN [JFK]</span>
          </div>
          <div className="footer-flight-line">
            <Plane size={15} className="footer-plane-icon" />
          </div>
          <div className="footer-flight-node">
            <Compass size={14} style={{ color: '#5EEAD4' }} />
            <span>DESTINATION [HND]</span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        {/* Brand & Mission */}
        <div className="footer-brand">
          <h3>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5EEAD4',
              }}
            >
              <Plane size={18} style={{ transform: 'rotate(-45deg)' }} />
            </span>
            <span>TravelGo</span>
          </h3>
          <p>
            Your passport to seamless flight & luxury hotel bookings. Built with event-driven saga reliability, transactional outbox consistency, and real-time streaming updates.
          </p>
          <div className="footer-status-pill">
            <span className="footer-pulse-dot" />
            <span>Distributed Saga Engine: Operational</span>
          </div>
        </div>

        {/* Explore Destinations */}
        <div className="footer-col">
          <h4>Explore</h4>
          <ul className="footer-links">
            <li>
              <Link to="/flights" className="footer-link">
                <Plane size={14} />
                <span>Search Flights</span>
              </Link>
            </li>
            <li>
              <Link to="/hotels" className="footer-link">
                <Hotel size={14} />
                <span>Luxury Hotels</span>
              </Link>
            </li>
            <li>
              <Link to="/flights?deal=bundle" className="footer-link">
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span>Vacation Packages</span>
              </Link>
            </li>
            <li>
              <Link to="/flights" className="footer-link">
                <Compass size={14} />
                <span>Trending Routes</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Traveler Services */}
        <div className="footer-col">
          <h4>Services</h4>
          <ul className="footer-links">
            <li>
              <Link to="/bookings" className="footer-link">
                <Luggage size={14} />
                <span>My Bookings</span>
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="footer-link">
                <Heart size={14} />
                <span>Saved Wishlist</span>
              </Link>
            </li>
            <li>
              <Link to="/price-alerts" className="footer-link">
                <Bell size={14} />
                <span>Price Alerts</span>
              </Link>
            </li>
            <li>
              <Link to="/loyalty" className="footer-link">
                <Award size={14} />
                <span>Rewards & Ledger</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* System Architecture */}
        <div className="footer-col">
          <h4>Architecture</h4>
          <ul className="footer-links">
            <li>
              <span className="footer-link" style={{ cursor: 'default' }}>
                <ShieldCheck size={14} style={{ color: '#5EEAD4' }} />
                <span>RabbitMQ Choreography</span>
              </span>
            </li>
            <li>
              <span className="footer-link" style={{ cursor: 'default' }}>
                <ShieldCheck size={14} style={{ color: '#5EEAD4' }} />
                <span>Redis Inventory Holds</span>
              </span>
            </li>
            <li>
              <span className="footer-link" style={{ cursor: 'default' }}>
                <ShieldCheck size={14} style={{ color: '#5EEAD4' }} />
                <span>Real-Time SSE Stream</span>
              </span>
            </li>
            <li>
              <span className="footer-link" style={{ cursor: 'default' }}>
                <ShieldCheck size={14} style={{ color: '#5EEAD4' }} />
                <span>Isolated DBs & Outbox</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-footer Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 TravelGo Inc. • Microservices Architecture (Node.js 20, React 18, RabbitMQ, Redis, PostgreSQL)</p>
          <div className="footer-bottom-links">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="stamp-badge stamp-badge-amber" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                v2.0.0
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
